import "./index.scss";

const EC = require('elliptic').ec;
const keccak256 = require('keccak256');
const ec = new EC('secp256k1');

const server = "http://localhost:3042";



const EXAMPLE_PK='bbbb709d7b1a26dae5aa3db010ec827900e15651021c686b1116128fc9a7891f';
const key = ec.keyFromPrivate(EXAMPLE_PK, 'hex');




document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;

  // TODO: fill in a msghash and a signature (to be validated by the server)
  const hash = keccak256(JSON.stringify({sender, amount, recipient})).toString('hex');
  const signature = key.sign(hash);

  const body = JSON.stringify({
    sender, amount, recipient, hash, signature,
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});
