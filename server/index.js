const express = require('express');
const EC = require('elliptic').ec;
const keccak256 = require('keccak256');
const ec = new EC('secp256k1');
const app = express();
const cors = require('cors');
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());


function toAddress(pub) {
  const addrHash = keccak256(pub).toString('hex');
  return '0x' + addrHash.substring(addrHash.length-40, addrHash.length); 
}


function getKeyPair() {
  const key = ec.genKeyPair();
  const public = key.getPublic().encode('hex');
  const addr = toAddress(public);

  return {
    private_key: key.getPrivate().toString('hex'),
    public_key: public,
    address: addr,
  }
}

/**
 * EXAMPLE KEYPAIR FOR SAKE OF ILLUSTRATION
 */
const EXAMPLE_PK='bbbb709d7b1a26dae5aa3db010ec827900e15651021c686b1116128fc9a7891f'
const exampleKeyPair = {
  private_key: EXAMPLE_PK,
  public_key: ec.keyFromPrivate(EXAMPLE_PK, 'hex').getPublic().encode('hex'),
};
exampleKeyPair.address = toAddress(exampleKeyPair.public_key)


const accounts = {
  0: exampleKeyPair,
  1: getKeyPair(),
  2: getKeyPair(),
}

// Simulate recovering public key from txs on chain
const keyTable = {
  [accounts[0].address]: accounts[0].public_key,
  [accounts[1].address]: accounts[1].public_key,
  [accounts[2].address]: accounts[2].public_key,
}

const balances = {
  [accounts[0].address]: 100,
  [accounts[1].address]: 50,
  [accounts[2].address]: 75,
}

console.log('Available Accounts')
console.log('==================')
for (let i in accounts) {
  console.log(`(${i}) ${accounts[i].address} (${balances[accounts[i].address]} ETH)`)
}
console.log('')

console.log('Private Keys')
console.log('==================')
for (let i in accounts) {
  console.log(`(${i}) 0x${accounts[i].private_key}`)
}
console.log('')


app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

/**
 * Validate that a signature is valid
 * @param {JSON} tx 
 * @return {BOOLEAN}
 */
function validate(tx) {
  const {sender, recipient, amount, hash, signature} = tx;
  const hashCheck = keccak256(JSON.stringify({
    sender, amount, recipient,
  })).toString('hex');

  const key = ec.keyFromPublic(keyTable[sender], 'hex');

  return (hash === hashCheck) && key.verify(hash, signature);
}

app.post('/send', (req, res) => {
  const {sender, recipient, amount, hash, signature} = req.body;
  const tx = req.body;

  if (!validate(tx)) {
    res.send({balance: balances[sender]}); return;
  }

  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
