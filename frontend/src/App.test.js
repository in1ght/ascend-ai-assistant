import { render, screen } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';

test('renders welcome screen', () => {
  render(
    <GoogleOAuthProvider clientId="test-client-id">
      <App />
    </GoogleOAuthProvider>
  );

  expect(screen.getByText(/Hi There!/i)).toBeInTheDocument();
});
