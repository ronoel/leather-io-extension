# Leather

This project is a fork of the [Leather Wallet extension](https://github.com/leather-io/extension) with minimal modifications to support [Bolt Protocol](https://github.com/ronoel/bolt-protocol).

Bolt Protocol enables users to pay transaction fees with sBTC on the Stacks Blockchain instead of using STX.

## Using Bolt Protocol with this Wallet

This wallet extension serves as a proof of concept for the Bolt Protocol integration, allowing you to pay transaction fees with sBTC on the Stacks Blockchain.

### Instructions

1. Install this extension in Google Chrome:
   - Run `pnpm dev` to build the extension
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `/dist` folder
2. Visit [BoltProto.org](https://boltproto.org/)
3. Connect with this wallet
4. Top up your Fee Fund with sBTC
5. After funding, you can access any dApp on the Stacks Blockchain and pay for your transactions with sBTC from your Fee Fund instead of STX

**Note:** As this is a Proof of Concept implementation, it has only been tested on the Google Chrome browser.

## Running the extension

This application is a Web Extension. There is no ability to run it as a standalone web application.

Each child of the `src` directory represents the script context in which it is ran.

### Use the right NVM version

```bash
nvm use 18
```

### Install packages

```bash
pnpm i
```

### Dev mode

```bash
pnpm dev
```

### Loading extension in your browser

You'll need to add it to your browser of choice. Leather only
supports Chromium and Firefox browsers. When you run `pnpm dev`, it will compile the application to the `/dist` folder

- [Chrome instructions](https://developer.chrome.com/docs/extensions/mv3/faq/#faq-dev-01)