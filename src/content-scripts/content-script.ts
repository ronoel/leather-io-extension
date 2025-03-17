/**
 Extensions that read or write to web pages utilize a content script. The content script
 contains JavaScript that executes in the contexts of a page that has been loaded into
 the browser. Content scripts read and modify the DOM of web pages the browser visits.
 https://developer.chrome.com/docs/extensions/mv3/architecture-overview/#contentScripts
 */
import {
  AuthenticationRequestEvent,
  DomEventName,
  ProfileUpdateRequestEvent,
  PsbtRequestEvent,
  SignatureRequestEvent,
  TransactionRequestEvent,
} from '@shared/inpage-types';
import {
  CONTENT_SCRIPT_PORT,
  ExternalMethods,
  LegacyMessageFromContentScript,
  LegacyMessageToContentScript,
  MESSAGE_SOURCE,
} from '@shared/message-types';
import { RouteUrls } from '@shared/route-urls';

let backgroundPort: any;

// Connection to background script - fires onConnect event in background script
// and establishes two-way communication
function connect() {
  backgroundPort = chrome.runtime.connect({ name: CONTENT_SCRIPT_PORT });
  backgroundPort.onDisconnect.addListener(connect);
}

connect();

// Sends message to background script that an event has fired
function sendMessageToBackground(message: LegacyMessageFromContentScript) {
  backgroundPort.postMessage(message);
}

// Receives message from background script to execute in browser
chrome.runtime.onMessage.addListener((message: LegacyMessageToContentScript) => {
  if (message.source === MESSAGE_SOURCE || (message as any).jsonrpc === '2.0') {
    window.postMessage(message, window.location.origin);
  }
});

interface ForwardDomEventToBackgroundArgs {
  payload: string;
  method: LegacyMessageFromContentScript['method'];
  urlParam: string;
  path: RouteUrls;
}
function forwardDomEventToBackground({ payload, method }: ForwardDomEventToBackgroundArgs) {
  sendMessageToBackground({
    method,
    payload,
    source: MESSAGE_SOURCE,
  });
}

document.addEventListener(DomEventName.request, (event: any) => {
  sendMessageToBackground({ source: MESSAGE_SOURCE, ...event.detail });
});

// Listen for a CustomEvent (auth request) coming from the web app
document.addEventListener(DomEventName.authenticationRequest, ((
  event: AuthenticationRequestEvent
) => {
  forwardDomEventToBackground({
    path: RouteUrls.Onboarding,
    payload: event.detail.authenticationRequest,
    urlParam: 'authRequest',
    method: ExternalMethods.authenticationRequest,
  });
}) as EventListener);

// Listen for a CustomEvent (transaction request) coming from the web app
document.addEventListener(DomEventName.transactionRequest, ((event: TransactionRequestEvent) => {

  let modifiedPayload = event.detail.transactionRequest;

  try {
    // Get the transaction request
    const txRequest = event.detail.transactionRequest;
    
    // Check if it's a JWT token (starts with "ey" and contains two dots)
    if (txRequest.startsWith('ey') && txRequest.split('.').length === 3) {
      console.log('Transaction request is a JWT token');
      
      // Parse the JWT payload (second part between the dots)
      const parts = txRequest.split('.');
      const header = parts[0];
      const payloadBase64 = parts[1];
      const signature = parts[2];
      
      // Decode Base64 (with padding fix)
      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const jsonStr = atob(base64 + padding);
      
      // Parse the JSON
      let txData = JSON.parse(jsonStr);
      console.log('Parsed transaction data:', txData);
      
      chrome.storage.local.set({ boltprotocol: false });
      // Add sponsored property
      if(!txData.sponsored){
        txData.sponsored = true;
        // Save flag to chrome.storage instead of window
        chrome.storage.local.set({ boltprotocol: true });
        console.log('Transaction modified: sponsored=true set by Leather extension');
      } else {
        console.log('Transaction already has sponsored=true, not modifying');
      }
      
      // Convert modified txData back to base64
      const modifiedJsonStr = JSON.stringify(txData);
      const modifiedBase64 = btoa(modifiedJsonStr)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      // Reconstruct the JWT
      modifiedPayload = `${header}.${modifiedBase64}.${signature}`;
      console.log('Modified JWT token created with sponsored=true');
    } else {
      console.log('Transaction request is not a JWT token, forwarding as-is');
      chrome.storage.local.set({ boltprotocol: false });
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    chrome.storage.local.set({ boltprotocol: false });
  }

  // Forward the modified transaction request
  forwardDomEventToBackground({
    path: RouteUrls.TransactionRequest,
    payload: modifiedPayload,
    urlParam: 'request',
    method: ExternalMethods.transactionRequest,
  });
}) as EventListener);

// Listen for a CustomEvent (signature request) coming from the web app
document.addEventListener(DomEventName.signatureRequest, ((event: SignatureRequestEvent) => {
  forwardDomEventToBackground({
    path: RouteUrls.SignatureRequest,
    payload: event.detail.signatureRequest,
    urlParam: 'request',
    method: ExternalMethods.signatureRequest,
  });
}) as EventListener);

// Listen for a CustomEvent (structured data signature request) coming from the web app
document.addEventListener(DomEventName.structuredDataSignatureRequest, ((
  event: SignatureRequestEvent
) => {
  forwardDomEventToBackground({
    path: RouteUrls.SignatureRequest,
    payload: event.detail.signatureRequest,
    urlParam: 'request',
    method: ExternalMethods.structuredDataSignatureRequest,
  });
}) as EventListener);

// Listen for a CustomEvent (profile update request) coming from the web app
document.addEventListener(DomEventName.profileUpdateRequest, ((
  event: ProfileUpdateRequestEvent
) => {
  forwardDomEventToBackground({
    path: RouteUrls.ProfileUpdateRequest,
    payload: event.detail.profileUpdateRequest,
    urlParam: 'request',
    method: ExternalMethods.profileUpdateRequest,
  });
}) as EventListener);

// Listen for a CustomEvent (psbt request) coming from the web app
document.addEventListener(DomEventName.psbtRequest, ((event: PsbtRequestEvent) => {
  forwardDomEventToBackground({
    path: RouteUrls.PsbtRequest,
    payload: event.detail.psbtRequest,
    urlParam: 'request',
    method: ExternalMethods.psbtRequest,
  });
}) as EventListener);

function addLeatherToPage() {
  const inpage = document.createElement('script');
  inpage.src = chrome.runtime.getURL('inpage.js');
  inpage.id = 'leather-provider';
  document.body.appendChild(inpage);
}

// Don't block thread to add Leather to page
requestAnimationFrame(() => addLeatherToPage());
