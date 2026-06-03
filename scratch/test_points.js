const handleRoundEnd = (state) => {
  let t1Score = state.scores.team1;
  let t2Score = state.scores.team2;
  const bidTeam = (state.bidWinner === 'bottom' || state.bidWinner === 'top') ? 'team1' : 'team2';
  let bidAmount = state.currentBid;

  let stakes = 1;
  if (state.isRedoubled) stakes = 4;
  else if (state.isDoubled) stakes = 2;

  let team1Won = false;
  if (state.isSingleHand) {
    if (bidTeam === 'team1') {
      const opponentWonTrick = state.tricksWon.left.length > 0 || state.tricksWon.right.length > 0;
      if (opponentWonTrick) { t1Score -= 3; team1Won = false; }
      else { t1Score += 3; team1Won = true; }
    } else {
      const opponentWonTrick = state.tricksWon.bottom.length > 0 || state.tricksWon.top.length > 0;
      if (opponentWonTrick) { t2Score -= 3; team1Won = true; }
      else { t2Score += 3; team1Won = false; }
    }
  } else {
    if (bidTeam === 'team1') {
      if (state.roundPoints.team1 >= bidAmount) { t1Score += stakes; team1Won = true; }
      else { t1Score -= stakes; team1Won = false; }
    } else {
      if (state.roundPoints.team2 >= bidAmount) { t2Score += stakes; team1Won = false; }
      else { t2Score -= stakes; team1Won = true; }
    }
  }

  t1Score = Math.max(-6, Math.min(6, t1Score));
  t2Score = Math.max(-6, Math.min(6, t2Score));

  const isGameOver = (t1Score >= 6 || t1Score <= -6 || t2Score >= 6 || t2Score <= -6);
  const nextPhase = isGameOver ? 'game_over' : 'round_over';

  return {
    ...state,
    phase: nextPhase,
    scores: { team1: t1Score, team2: t2Score },
    lastRoundResult: { team1Won }
  };
};

// Test Case 1: Normal round, Team 1 bids 16, gets 17, isSingleHand is false
const state1 = {
  scores: { team1: 0, team2: 0 },
  bidWinner: 'bottom',
  currentBid: 16,
  isDoubled: false,
  isRedoubled: false,
  isSingleHand: false,
  roundPoints: { team1: 17, team2: 11 },
  tricksWon: { bottom: [{}], top: [{}], left: [{}], right: [{}] }
};

const res1 = handleRoundEnd(state1);
console.log('Test Case 1 Result:', res1.scores); // Expected: { team1: 1, team2: 0 }

// Test Case 2: Normal round, Team 1 bids 16, gets 17, isSingleHand is "false" (string)
const state2 = {
  scores: { team1: 0, team2: 0 },
  bidWinner: 'bottom',
  currentBid: 16,
  isDoubled: false,
  isRedoubled: false,
  isSingleHand: "false",
  roundPoints: { team1: 17, team2: 11 },
  tricksWon: { bottom: [{}], top: [{}], left: [{}], right: [{}] }
};

const res2 = handleRoundEnd(state2);
console.log('Test Case 2 Result:', res2.scores); // Expected: { team1: 1, team2: 0 } if falsy, or { team1: 3, team2: 0 } if truthy
