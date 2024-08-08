// // src/index.tsx
// import React from 'react';
// import ReactDOM from 'react-dom';
// import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
// import App from './App';

// const client = new ApolloClient({
//   uri: 'https://coding.vshare.net/vdosound', // Replace with your GraphQL endpoint
//   // uri: 'http://localhost:8081/vdosound', // Replace with your GraphQL endpoint
//   cache: new InMemoryCache(),
// });

// ReactDOM.render(
//   <ApolloProvider client={client}>
//     <App />
//   </ApolloProvider>,
//   document.getElementById('root')
// );


// index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Adjust the path as needed
import './index.css'; // Adjust the path as needed
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://coding.vshare.net/vdosound', // Replace with your GraphQL endpoint
  // uri: 'http://localhost:8081/vdosound', // Replace with your GraphQL endpoint
  cache: new InMemoryCache(),
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
         <ApolloProvider client={client}>
     <App />
   </ApolloProvider>,
    </React.StrictMode>
  );
}
