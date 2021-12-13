import { web3 } from "hardhat";
import * as rlp from "rlp";
import keccak from "keccak";

export const predictAddresses = async ({ creator }: { creator: string }) => {
  creator = creator || "0x5fd56Fa5a86C91031714df9e10751778093062A0";

  let currentNonce = await web3.eth.getTransactionCount(creator);
  let currentNonceHex = `0x${currentNonce.toString(16)}`;
  let currentInputArr = [creator, currentNonceHex];
  let currentRlpEncoded = rlp.encode(currentInputArr);
  let currentContractAddressLong = keccak("keccak256").update(currentRlpEncoded).digest("hex");
  let currentContractAddress = `0x${currentContractAddressLong.substring(24)}`;
  let currentContractAddressChecksum = web3.utils.toChecksumAddress(currentContractAddress);

  let nextNonce = currentNonce + 1;
  let nextNonceHex = `0x${nextNonce.toString(16)}`;
  let nextInputArr = [creator, nextNonceHex];
  let nextRlpEncoded = rlp.encode(nextInputArr);
  let nextContractAddressLong = keccak("keccak256").update(nextRlpEncoded).digest("hex");
  let nextContractAddress = `0x${nextContractAddressLong.substring(24)}`;
  let nextContractAddressChecksum = web3.utils.toChecksumAddress(nextContractAddress);

  return {
    vault: currentContractAddressChecksum,
    strategy: nextContractAddressChecksum,
  };
};
