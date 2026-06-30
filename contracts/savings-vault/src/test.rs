use super::{Position, SavingsVault, SavingsVaultClient};
use soroban_sdk::{Address, Env, testutils::Address as _};

#[test]
fn creates_an_empty_position_and_exposes_terms() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(SavingsVault, (&admin, &token, 500_u32));
    let client = SavingsVaultClient::new(&env, &contract_id);

    assert_eq!(client.apy_bps(), 500);
    assert_eq!(client.token(), token);
    assert_eq!(client.total_deposits(), 0);
    assert_eq!(client.reward_reserve(), 0);
    assert_eq!(
        client.position(&user),
        Position {
            principal: 0,
            accrued_yield: 0,
            updated_at: 0,
        }
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn rejects_an_unsafe_apy() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    env.register(SavingsVault, (&admin, &token, 5_001_u32));
}
