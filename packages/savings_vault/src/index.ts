import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAN7GWJJCUM6UOXYWSWFER7WN5T2MOSC4LLI2UYTIQ2SEHWKOHW2YNPV",
  }
} as const


export interface Position {
  accrued_yield: i128;
  principal: i128;
  updated_at: u64;
}

export const VaultError = {
  1: {message:"InvalidAmount"},
  2: {message:"InvalidApy"},
  3: {message:"InsufficientBalance"},
  4: {message:"NoYieldAvailable"},
  5: {message:"Unauthorized"}
}

export interface Client {
  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposits a Stellar asset into the vault. The account must authorize the
   * token transfer, so the contract never receives custody without consent.
   */
  deposit: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Position>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraws principal while preserving any yield already accrued.
   */
  withdraw: ({owner, amount}: {owner: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Position>>

  /**
   * Construct and simulate a fund_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adds real tokens to the reward reserve. Only the configured admin can
   * fund it; claims can never create unbacked assets.
   */
  fund_rewards: ({admin, amount}: {admin: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a claim_yield transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claims accrued yield, capped by the funded reward reserve.
   */
  claim_yield: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a position transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  position: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Position>>

  /**
   * Construct and simulate a total_deposits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_deposits: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a reward_reserve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  reward_reserve: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a apy_bps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  apy_bps: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  token: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, token, apy_bps}: {admin: string, token: string, apy_bps: u32},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, token, apy_bps}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACFBvc2l0aW9uAAAAAwAAAAAAAAANYWNjcnVlZF95aWVsZAAAAAAAAAsAAAAAAAAACXByaW5jaXBhbAAAAAAAAAsAAAAAAAAACnVwZGF0ZWRfYXQAAAAAAAY=",
        "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAUAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAABAAAAAAAAAApJbnZhbGlkQXB5AAAAAAACAAAAAAAAABNJbnN1ZmZpY2llbnRCYWxhbmNlAAAAAAMAAAAAAAAAEE5vWWllbGRBdmFpbGFibGUAAAAEAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAF",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAdhcHlfYnBzAAAAAAQAAAAA",
        "AAAAAAAAAI9EZXBvc2l0cyBhIFN0ZWxsYXIgYXNzZXQgaW50byB0aGUgdmF1bHQuIFRoZSBhY2NvdW50IG11c3QgYXV0aG9yaXplIHRoZQp0b2tlbiB0cmFuc2Zlciwgc28gdGhlIGNvbnRyYWN0IG5ldmVyIHJlY2VpdmVzIGN1c3RvZHkgd2l0aG91dCBjb25zZW50LgAAAAAHZGVwb3NpdAAAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAB9AAAAAIUG9zaXRpb24=",
        "AAAAAAAAAD9XaXRoZHJhd3MgcHJpbmNpcGFsIHdoaWxlIHByZXNlcnZpbmcgYW55IHlpZWxkIGFscmVhZHkgYWNjcnVlZC4AAAAACHdpdGhkcmF3AAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAH0AAAAAhQb3NpdGlvbg==",
        "AAAAAAAAAHdBZGRzIHJlYWwgdG9rZW5zIHRvIHRoZSByZXdhcmQgcmVzZXJ2ZS4gT25seSB0aGUgY29uZmlndXJlZCBhZG1pbiBjYW4KZnVuZCBpdDsgY2xhaW1zIGNhbiBuZXZlciBjcmVhdGUgdW5iYWNrZWQgYXNzZXRzLgAAAAAMZnVuZF9yZXdhcmRzAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAACw==",
        "AAAAAAAAADpDbGFpbXMgYWNjcnVlZCB5aWVsZCwgY2FwcGVkIGJ5IHRoZSBmdW5kZWQgcmV3YXJkIHJlc2VydmUuAAAAAAALY2xhaW1feWllbGQAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIcG9zaXRpb24AAAABAAAAAAAAAAVvd25lcgAAAAAAABMAAAABAAAH0AAAAAhQb3NpdGlvbg==",
        "AAAAAAAAAAAAAAAOdG90YWxfZGVwb3NpdHMAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAOcmV3YXJkX3Jlc2VydmUAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAHYXB5X2JwcwAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAFdG9rZW4AAAAAAAAAAAAAAQAAABM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    deposit: this.txFromJSON<Position>,
        withdraw: this.txFromJSON<Position>,
        fund_rewards: this.txFromJSON<i128>,
        claim_yield: this.txFromJSON<i128>,
        position: this.txFromJSON<Position>,
        total_deposits: this.txFromJSON<i128>,
        reward_reserve: this.txFromJSON<i128>,
        apy_bps: this.txFromJSON<u32>,
        token: this.txFromJSON<string>
  }
}