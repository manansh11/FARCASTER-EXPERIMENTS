const { providers, Contract, utils } = require("ethers");
const got = require("got");

const test = async () => {
  const KEY =
    "REPLACE-WITH-ALCHEMY-KEY";
  const provider = new providers.JsonRpcProvider(KEY);
  const block = await provider.getBlockNumber();
  console.log(block);

  // Connecting to Farcaster Registry
  const REGISTRY_CONTRACT_ADDRESS =
    "0xe3Be01D99bAa8dB9905b33a3cA391238234B79D1";
  const REGISTRY_ABI = [
    {
      name: "getDirectoryUrl",
      inputs: [{ internalType: "bytes32", name: "username", type: "bytes32" }],
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "addressToUsername",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const registryContrace = new Contract(
    REGISTRY_CONTRACT_ADDRESS,
    REGISTRY_ABI,
    provider
  );

  const username = "manansh";
  const byte32Name = utils.formatBytes32String(username);
  const directoryUrl = await registryContrace.getDirectoryUrl(byte32Name);
  console.log(`${username}'s Host is located at: ${directoryUrl} \n`);

  // Fetching User Directory
  const directoryResponse = await got(directoryUrl);
  const directory = JSON.parse(directoryResponse.body);
  console.log(`${username}'s Directory is: `);
  console.log(directory, "\n");

  // Fetching User Casts
  const addressActivityUrl = directory.body.addressActivityUrl;
  const addressActivityResponse = await got(addressActivityUrl);
  const addressActivity = JSON.parse(addressActivityResponse.body);
  const cast = addressActivity[0];
  console.log(`${username}'s most recent Cast was: `);
  console.log(cast, "\n");

  // Verify that the cast is legit (check if the cast itself matches the merkle root) then check if the recovered address matches the sender
  const stringifiedCastBody = JSON.stringify(cast.body);
  const calculatedHash = utils.keccak256(
    utils.toUtf8Bytes(stringifiedCastBody)
  );
  const expectedHash = cast.merkleRoot;

  if (calculatedHash !== expectedHash) {
    console.log(
      `FAILED: the calculated hash ${calculatedHash} does not match the one in the cast: ${expectedHash}`
    );
  } else {
    console.log(
      `PASSED: the calculated hash ${calculatedHash} matches the one in the cast`
    );
  }

  const recoveredAddress = utils.verifyMessage(cast.merkleRoot, cast.signature);
  const expectedAddress = cast.body.address;

  if (recoveredAddress !== expectedAddress) {
    console.log(
      `Failed: the recovered address ${recoveredAddress} does not match the address  provided in the cast ${expectedAddress}`
    );
  } else {
    console.log(`PASSED: the recovered address ${recoveredAddress} matches the one in the cast`);
  }



  const encodedUsername = await registryContrace.addressToUsername(expectedAddress)
  const expectedUsername = utils.parseBytes32String(encodedUsername)
  const castUsername = cast.body.username;

  if (expectedUsername !== castUsername) {
    console.log(`FAILED: ${expectedAddress} does not own ${castUsername}, it owns ${expectedUsername}`);
  } else {
    console.log(`PASSED: ${expectedAddress} owns ${castUsername}`);
  }

};

test();
