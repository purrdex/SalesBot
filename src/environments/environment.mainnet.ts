import { appConfig } from './app';

export const environment = {
  ...appConfig,

  env: 'mainnet',
  production: false,
  chainId: 1,

  // rpcHttpProvider: 'https://eth-mainnet.g.alchemy.com/v2/19IQKn99eagaaRKD-uSOCE1aYEHLSnmL',
  rpcHttpProvider: 'https://eth-mainnet.g.alchemy.com/v2/HFeSFClBkc9DTrM6oBL-ZsNmN6Co6R3J',
  // rpcHttpProvider: 'https://eth-mainnet.g.alchemy.com/v2/19IQKn99eagaaRKD-uSOCE1aYEHLSnmL',
  explorerUrl: 'https://etherscan.io',
  externalMarketUrl: 'https://ethscriptions.com',

  magmaRpcHttpProvider: 'https://turbo.magma-rpc.com',

  marketAddress: '0xe6A0939270D6998f74C23DD355AfAa679A974e9F'.toLowerCase(),
  marketAddressL2: '0x3Dfbc8C62d3cE0059BDaf21787EC24d5d116fe1e'.toLowerCase(),
  donationsAddress: '0x26714F8Ff1D3f9c004fdD3128FE0d615d906384D'.toLowerCase(),
  pointsAddress: '0x8FFB17E1f5aCeb5aE49cd499Ce185Cb9abcC87F1'.toLowerCase(),
  bridgeAddress: ''.toLowerCase(),
  bridgeAddressL2: '0x26e8fD77346b4B006C5Df61f9706581933560F12'.toLowerCase(),

  relayUrl: 'https://marketplace.mfpurrs.com/',
  staticUrl: 'https://wmaqzjpcegjhuwqctnht.supabase.co/storage/v1/object/public',

  supabaseUrl: 'https://wmaqzjpcegjhuwqctnht.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYXF6anBjZWdqaHV3cWN0bmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4Mzk2MDcsImV4cCI6MjA2MDQxNTYwN30.6QwM_NidLBrUYSyv_of6E7h6hfIhGj2tdJ18ED33GQw',
  //staticUrl: 'https://kcbuycbhynlmsrvoegzp.supabase.co/storage/v1/object/public',

  //supabaseUrl: 'https://kcbuycbhynlmsrvoegzp.supabase.co',
  //supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnV5Y2JoeW5sbXNydm9lZ3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyMTMzNTQsImV4cCI6MjAwNDc4OTM1NH0.jUvNzW6jrBPfKg9SvDhW5auqF8y_DKo4tmAmXCwgHAY',
};