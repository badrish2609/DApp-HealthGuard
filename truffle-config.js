module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Ganache UI default port
      network_id: "*", // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.0", // Make sure this matches your contract pragma
    },
  },
  // Add more config here if needed
};
