import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { friendlyService } from '../../services/friendlyService';
import FriendlyPage from '../FriendlyPage';
import { User } from '@supabase/supabase-js';

// Prevent Jest from hoisting the mock above the imports
jest.unmock('react-router-dom');

// Mock the friendlyService
jest.mock('../../services/friendlyService');
const mockedFriendlyService = friendlyService as jest.Mocked<typeof friendlyService>;

// Manually mock react-router-dom hooks
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  useLocation: () => ({
    pathname: '/friendly',
    state: null,
  }),
}));

const mockUser = {
  id: 'user-1',
  email: 'user1@test.com',
} as User;

const mockAuthContext = {
  user: mockUser,
  loading: false,
  logout: jest.fn(),
  // Add other properties if your component uses them
};

const TestComponent = () => (
  <AuthContext.Provider value={mockAuthContext as any}>
    <MemoryRouter initialEntries={['/friendly']}>
      <Routes>
        <Route path="/friendly" element={<FriendlyPage />} />
        <Route path="/friendly/match" element={<div>Match Page</div>} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>
);

describe('FriendlyPage Flow', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the subscriptions to return a mock unsubscribe function
    mockedFriendlyService.subscribeToChallenges.mockReturnValue({ unsubscribe: jest.fn() } as any);
    mockedFriendlyService.subscribeToMatches.mockReturnValue({ unsubscribe: jest.fn() } as any);
  });

  it('should automatically navigate challenger when their challenge is accepted', async () => {
    // 1. Initial state: User 1 (challenger) has sent a challenge to User 2.
    const outgoingChallenge = {
      id: 'challenge-1',
      challenger_id: 'user-1',
      challenger_username: 'user1',
      challenged_id: 'user-2',
      challenged_username: 'user2',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    mockedFriendlyService.getActiveMatch.mockResolvedValue(null);
    mockedFriendlyService.getPendingChallenges.mockResolvedValue([]);
    mockedFriendlyService.getOutgoingPendingChallenges.mockResolvedValue([outgoingChallenge as any]);

    render(<TestComponent />);

    // Verify the outgoing challenge is displayed
    await waitFor(() => {
      expect(screen.getByText('Challenge to user2')).toBeInTheDocument();
      expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
    });

    // 2. Simulate User 2 accepting the challenge.
    // The service will first return the updated challenge, then the new match.
    const acceptedChallenge = { ...outgoingChallenge, status: 'accepted' };
    const newMatch = {
      id: 'match-1',
      challenge_id: 'challenge-1',
      player1_id: 'user-1',
      player2_id: 'user-2',
      match_status: 'starting',
    };

    // This simulates the real-time "challenge updated" event firing
    const challengeCallback = mockedFriendlyService.subscribeToChallenges.mock.calls[0][1];
    challengeCallback({ eventType: 'UPDATE', new: acceptedChallenge });
    
    // In our new architecture, the UPDATE handler triggers `checkServerState`.
    // Let's mock the service calls for that check.
    // First, it will find no active match (because the update is on the challenges table).
    // Then, on the second check (triggered by the match subscription), it will find the match.
    mockedFriendlyService.getActiveMatch.mockResolvedValueOnce(null).mockResolvedValueOnce(newMatch as any);

    // This simulates the real-time "match created" event firing
    const matchCallback = mockedFriendlyService.subscribeToMatches.mock.calls[0][1];
    matchCallback({ eventType: 'INSERT', new: newMatch });
    
    // 3. Verify that the challenger is automatically navigated to the match page.
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/friendly/match', {
        state: { match: newMatch },
      });
    });

    // And verify the match page content is rendered
    expect(screen.getByText('Match Page')).toBeInTheDocument();
  });

  it('should navigate acceptor to match page immediately upon accepting', async () => {
    // 1. Initial state: User 1 (acceptor) has received a challenge from User 2.
    const incomingChallenge = {
      id: 'challenge-2',
      challenger_id: 'user-2',
      challenger_username: 'user2',
      challenged_id: 'user-1',
      challenged_username: 'user1',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    mockedFriendlyService.getActiveMatch.mockResolvedValue(null);
    mockedFriendlyService.getPendingChallenges.mockResolvedValue([incomingChallenge as any]);
    mockedFriendlyService.getOutgoingPendingChallenges.mockResolvedValue([]);

    render(<TestComponent />);

    // Verify the incoming challenge is displayed
    await waitFor(() => {
      expect(screen.getByText('Challenge from user2')).toBeInTheDocument();
    });
    
    // 2. Simulate User 1 clicking "Accept".
    const newMatch = {
        id: 'match-2',
        challenge_id: 'challenge-2',
        player1_id: 'user-2',
        player2_id: 'user-1',
        match_status: 'starting',
    };
    mockedFriendlyService.acceptChallenge.mockResolvedValue({ 
        success: true, 
        message: 'Challenge accepted!',
        match: newMatch as any 
    });

    fireEvent.click(screen.getByRole('button', { name: /Accept/i }));

    // 3. Verify the service was called and navigation occurred.
    await waitFor(() => {
        expect(mockedFriendlyService.acceptChallenge).toHaveBeenCalledWith('challenge-2');
    });

    await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/friendly/match', {
          state: { match: newMatch },
        });
    });
    
    expect(screen.getByText('Match Page')).toBeInTheDocument();
  });
}); 