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


function getKeyPair() {
  const key = ec.genKeyPair();
  const public = key.getPublic().encode('hex');
  var addr = keccak256(public).toString('hex');

  // shorten according to ethereum standard
  addr = '0x' + addr.substring(addr.length-40, addr.length);
  return {
    private_key: key.getPrivate().toString('hex'),
    public_key: public,
    address: addr,
  }
}

const accounts = {
  0: getKeyPair(),
  1: getKeyPair(),
  2: getKeyPair(),
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

app.post('/send', (req, res) => {
  const {sender, recipient, amount} = req.body;
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
