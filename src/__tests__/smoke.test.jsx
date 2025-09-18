import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { store } from '../redux/store';

describe('App smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <React.StrictMode>
        <Provider store={store}>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </Provider>
      </React.StrictMode>
    );
    expect(container).toBeTruthy();
  });
});
