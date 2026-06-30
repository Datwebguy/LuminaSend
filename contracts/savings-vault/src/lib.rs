#![no_std]

use soroban_sdk::{
    Address, Env, contract, contracterror, contractimpl, contracttype, panic_with_error, token,
};

const BPS_DENOMINATOR: i128 = 10_000;
const SECONDS_PER_YEAR: i128 = 31_536_000;
const MAX_APY_BPS: u32 = 5_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub principal: i128,
    pub accrued_yield: i128,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Token,
    ApyBps,
    TotalDeposits,
    RewardReserve,
    Position(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum VaultError {
    InvalidAmount = 1,
    InvalidApy = 2,
    InsufficientBalance = 3,
    NoYieldAvailable = 4,
    Unauthorized = 5,
}

#[contract]
pub struct SavingsVault;

#[contractimpl]
impl SavingsVault {
    pub fn __constructor(env: Env, admin: Address, token: Address, apy_bps: u32) {
        if apy_bps > MAX_APY_BPS {
            panic_with_error!(&env, VaultError::InvalidApy);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::ApyBps, &apy_bps);
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposits, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::RewardReserve, &0_i128);
    }

    /// Deposits a Stellar asset into the vault. The account must authorize the
    /// token transfer, so the contract never receives custody without consent.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Position {
        require_positive(&env, amount);
        from.require_auth();

        let position = settle_position(&env, &from);
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_address).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        let next = Position {
            principal: position.principal + amount,
            accrued_yield: position.accrued_yield,
            updated_at: env.ledger().timestamp(),
        };
        save_position(&env, &from, &next);
        adjust_total(&env, amount);
        next
    }

    /// Withdraws principal while preserving any yield already accrued.
    pub fn withdraw(env: Env, owner: Address, amount: i128) -> Position {
        require_positive(&env, amount);
        owner.require_auth();

        let position = settle_position(&env, &owner);
        if amount > position.principal {
            panic_with_error!(&env, VaultError::InsufficientBalance);
        }

        let next = Position {
            principal: position.principal - amount,
            accrued_yield: position.accrued_yield,
            updated_at: env.ledger().timestamp(),
        };
        save_position(&env, &owner, &next);
        adjust_total(&env, -amount);

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_address).transfer(
            &env.current_contract_address(),
            &owner,
            &amount,
        );
        next
    }

    /// Adds real tokens to the reward reserve. Only the configured admin can
    /// fund it; claims can never create unbacked assets.
    pub fn fund_rewards(env: Env, admin: Address, amount: i128) -> i128 {
        require_positive(&env, amount);
        admin.require_auth();

        let configured_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != configured_admin {
            panic_with_error!(&env, VaultError::Unauthorized);
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_address).transfer(
            &admin,
            &env.current_contract_address(),
            &amount,
        );
        let reserve = reward_reserve(&env) + amount;
        env.storage()
            .instance()
            .set(&DataKey::RewardReserve, &reserve);
        reserve
    }

    /// Claims accrued yield, capped by the funded reward reserve.
    pub fn claim_yield(env: Env, owner: Address) -> i128 {
        owner.require_auth();
        let mut position = settle_position(&env, &owner);
        let reserve = reward_reserve(&env);
        let claimable = position.accrued_yield.min(reserve);
        if claimable <= 0 {
            panic_with_error!(&env, VaultError::NoYieldAvailable);
        }

        position.accrued_yield -= claimable;
        save_position(&env, &owner, &position);
        env.storage()
            .instance()
            .set(&DataKey::RewardReserve, &(reserve - claimable));

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_address).transfer(
            &env.current_contract_address(),
            &owner,
            &claimable,
        );
        claimable
    }

    pub fn position(env: Env, owner: Address) -> Position {
        preview_position(&env, &owner)
    }

    pub fn total_deposits(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalDeposits)
            .unwrap_or(0)
    }

    pub fn reward_reserve(env: Env) -> i128 {
        reward_reserve(&env)
    }

    pub fn apy_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ApyBps).unwrap()
    }

    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }
}

fn require_positive(env: &Env, amount: i128) {
    if amount <= 0 {
        panic_with_error!(env, VaultError::InvalidAmount);
    }
}

fn empty_position(env: &Env) -> Position {
    Position {
        principal: 0,
        accrued_yield: 0,
        updated_at: env.ledger().timestamp(),
    }
}

fn load_position(env: &Env, owner: &Address) -> Position {
    env.storage()
        .persistent()
        .get(&DataKey::Position(owner.clone()))
        .unwrap_or_else(|| empty_position(env))
}

fn calculate_yield(env: &Env, position: &Position) -> i128 {
    if position.principal == 0 {
        return 0;
    }
    let elapsed = env.ledger().timestamp().saturating_sub(position.updated_at) as i128;
    let apy_bps: u32 = env.storage().instance().get(&DataKey::ApyBps).unwrap();
    position.principal * i128::from(apy_bps) * elapsed / (BPS_DENOMINATOR * SECONDS_PER_YEAR)
}

fn preview_position(env: &Env, owner: &Address) -> Position {
    let stored = load_position(env, owner);
    Position {
        principal: stored.principal,
        accrued_yield: stored.accrued_yield + calculate_yield(env, &stored),
        updated_at: env.ledger().timestamp(),
    }
}

fn settle_position(env: &Env, owner: &Address) -> Position {
    let settled = preview_position(env, owner);
    save_position(env, owner, &settled);
    settled
}

fn save_position(env: &Env, owner: &Address, position: &Position) {
    let key = DataKey::Position(owner.clone());
    env.storage().persistent().set(&key, position);
    env.storage()
        .persistent()
        .extend_ttl(&key, 30 * 17_280, 365 * 17_280);
}

fn adjust_total(env: &Env, delta: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalDeposits)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::TotalDeposits, &(current + delta));
}

fn reward_reserve(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::RewardReserve)
        .unwrap_or(0)
}

#[cfg(test)]
mod test;
