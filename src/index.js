import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";

function Button(props) {
  return (
    <button onClick={props.clicked}>
      {props.value}
    </button>
  );
}

function Container(props) {
  const [cells, onCellUpdate] = useState(Array(9).fill(null));
  const [nextPlayer, onNextPlayerUpdate] = useState(1);
  const gameOver = findWinner();
  const [players, onPlayersUpdate] = useState(
    {
      player1: {name: 'Player 1', moves: 0},
      player2: {name: 'Player 2', moves: 0},
      score: 0
    }
  );
  function createCell(index) {
    return (
      <Button
        value={cells[index]}
        clicked={() => {
          if (cells[index] || gameOver) { return; }
          let updatedArr = cells.slice();
          let updatedPlayers = players;
          updatedArr[index] = nextPlayer === 1 ? 'x' : 'o';
          updatedPlayers[nextPlayer === 1 ? 'player1' : 'player2'].moves += 1;
          onCellUpdate(updatedArr);
          onNextPlayerUpdate(nextPlayer === 1 ? 2 : 1);
          onPlayersUpdate(updatedPlayers);
        }}
      />
    );
  }
  function checkDraw() {
    for(let i=0; i < cells.length; i++) {
      if(cells[i] === null) {
        return false;
      }
    }
    return true;
  }
  function createHighScore() {
    let updatedPlayers = players;
    const maxScore = 10;
    const winner = updatedPlayers.player1.moves > updatedPlayers.player2.moves ? updatedPlayers.player1.moves : updatedPlayers.player2.moves;
    updatedPlayers.score = maxScore - winner === 0 ? 1 : maxScore - winner;
    fetch('http://localhost:3002/assessment/add' , {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(players)
    })
    .then((result) => result.json())
    .then((info) => { console.log(info); })
  }
  function findWinner() {
    const linearPackets = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for(let i = 0; i < linearPackets.length; i++) {
      if (cells[linearPackets[i][0]] && cells[linearPackets[i][0]] === cells[linearPackets[i][1]] && cells[linearPackets[i][0]] === cells[linearPackets[i][2]]) {
        return cells[linearPackets[i][0]];
      }
    }
    return false;
  }
  function onChanges() {
    const gameWinner = findWinner();
    if (gameWinner) {
      const playerIndex = gameWinner === 'x' ? 0 : 1;
      createHighScore();
      return `${players[playerIndex === 0 ? 'player1' : 'player2'].name} won the game!`;
    } else if(checkDraw()) {
      return `Game between ${players['player1'].name} and ${players['player2'].name} ended with a draw`;
    } else {
      const playerIndex = nextPlayer === 1 ? 0 : 1;
      const playerName = playerIndex === 0 ? players.player1.name : players.player2.name;
      return `${playerName}'s time to place the ${playerIndex === 0 ? 'x' : 'o'}`;
    }
  }
  function onInputKeyUp(playerIndex, targetData) {
    let updatedArr = players;
    let sanitizedData = targetData.replace(/\s/g,'');
    updatedArr[playerIndex].name = sanitizedData === '' ? `Player ${playerIndex}` : targetData.replace(/ /g,'');
    onPlayersUpdate(updatedArr);
  }
  return (
    <div className="container-main">
      <h1 className="header">Assessment App</h1>
      <div className="container-game">
        {createCell(0)}
        {createCell(1)}
        {createCell(2)}
        {createCell(3)}
        {createCell(4)}
        {createCell(5)}
        {createCell(6)}
        {createCell(7)}
        {createCell(8)}
      </div>
      <div className="container-status">{onChanges()}</div>
      <div className="container-inputs">
        <div className="input-group">
          <label>Player 1 Name: </label>
          <input id="player-1" type="text" placeholder="Player 1" onKeyUp={(e) => {onInputKeyUp('player1', e.target.value)}}/>
        </div>
        <div className="input-group">
          <label>Player 2 Name: </label>
          <input id="player-2" type="text" placeholder="Player 2" onKeyUp={(e) => {onInputKeyUp('player2', e.target.value)}}/>
        </div>
      </div>
      <div className="container-control">
        <button onClick={() => {
          document.querySelector("#player-1").value = '';
          document.querySelector("#player-2").value = '';
          onCellUpdate(Array(9).fill(null));
          onNextPlayerUpdate(1);
          onPlayersUpdate({
            player1:{name: 'Player 1', moves: 0},
            player2:{name: 'Player 2', moves: 0},
            score: 0
          })
        }}>Reset game</button>
        <button onClick={() => {
          ReactDOM.render(<ScoreBoard />, document.getElementById("root"));
        }}>View highscores</button>
      </div>
    </div>
  );
}
function List(props) {
  if (!props.data) { return (<ul></ul>); }
  const listItems = props.data.map((item, index) => 
    <ListItem item={item} key={index} />
  );
  return (
    <ul>{listItems}</ul>
  );
}
function ListItem(props) {
  let data = props.item;
  let value;
  if (data.player1.moves > data.player2.moves && data.score !== 0) {
    value = `${data.player1.name} with a score of ${data.score}`;
  } else if (data.player1.moves < data.player2.moves && data.score !== 0) {
    value = `${data.player2.name} with a score of ${data.score}`;
  } else if (data.player1.moves === data.player2.moves && data.score !== 0) {
    value = `${data.player2.name} with a score of ${data.score}`;
  } else if (data.score === 0) {
    value = `${data.player1.name} and ${data.player2.name} for 0 points (draw)`;
  }
  return (
    <li>{value}</li>
  );
}
class ScoreBoard extends React.Component {
  state = {
    scores: []
  }
  componentDidMount() {
    fetch('http://localhost:3002/assessment/fetchAll' , {
      method: "GET",
      headers: {
        'Content-type': 'application/json'
      },
    })
    .then((result) => result.json())
    .then((res) => {
      const data = res.highscores;
      this.setState({scores:data})
    });
  }
  render() {
    return (
      <div className="scoreboard-container">
      <h1>Highscores
        <span onClick={() => ReactDOM.render(<Container />, document.getElementById("root"))}>Go back to game</span>
      </h1>
      
      {this.state && this.state.scores &&
        <List data={this.state.scores} />
      }
    </div>
    );
  }
}

ReactDOM.render(<Container />, document.getElementById("root"));