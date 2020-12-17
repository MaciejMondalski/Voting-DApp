import React, { useEffect, useState } from "react";
import Voting from "./contracts/Voting.json";
import { getWeb3 } from "./utils.js";
import GlobalStyles from "./GlobalStyles";
import styled from "styled-components";

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [admin, setAdmin] = useState(undefined);
  const [ballots, setBallots] = useState([]);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Voting.networks[networkId];
      const contract = new web3.eth.Contract(
        Voting.abi,
        deployedNetwork && deployedNetwork.address
      );
      const admin = await contract.methods.admin().call();

      setWeb3(web3);
      setAccounts(accounts);
      setContract(contract);
      setAdmin(admin);
    };
    init();
    window.ethereum.on("accountsChanged", (accounts) => {
      setAccounts(accounts);
    });
  }, []);

  const isReady = () => {
    return (
      typeof contract !== "undefined" &&
      typeof web3 !== "undefined" &&
      typeof accounts !== "undefined" &&
      typeof admin !== "undefined"
    );
  };

  useEffect(() => {
    if (isReady()) {
      updateBallots();
    }
  }, [accounts, contract, web3, admin]);

  async function updateBallots() {
    const nextBallotId = parseInt(
      await contract.methods.nextBallotId().call()
    );

    const ballots = [];
    for (let i = 0; i < nextBallotId; i++) {
      const [ballot, hasVoted] = await Promise.all([
        contract.methods.getBallot(i).call(),
        contract.methods.votes(accounts[0], i).call(),
      ]);
      ballots.push({ ...ballot, hasVoted });
    }
    setBallots(ballots);
  }

  async function createBallot(e) {
    e.preventDefault();
    const name = e.target.elements[0].value;
    const choices = e.target.elements[1].value.split(",");
    const duration = e.target.elements[2].value;
    await contract.methods
      .createBallot(name, choices, duration)
      .send({ from: accounts[0] });
    await updateBallots();
  }

  async function addVoters(e) {
    e.preventDefault();
    const voters = e.target.elements[0].value.split(",");
    await contract.methods
      .addVoters(voters)
      .send({ from: accounts[0] });
  }

  async function vote(e, ballotId) {
    e.preventDefault();
    const select = e.target.elements[0];
    const choiceId = select.options[select.selectedIndex].value;
    await contract.methods
      .vote(ballotId, choiceId)
      .send({ from: accounts[0] });
    await updateBallots();
  }

  function isFinished(ballot) {
    const now = new Date().getTime();
    const ballotEnd = new Date(parseInt(ballot.end) * 1000).getTime();
    return ballotEnd - now > 0 ? false : true;
  }

  if (!isReady()) {
    return <div>Loading...</div>;
  }
  return (
    <div className="container">
      <GlobalStyles />

      <StyledLogo>
        <h1 className="text-center">Voting</h1>
        <i className="icon fas fa-vote-yea"></i>
      </StyledLogo>

      {accounts[0].toLowerCase() === admin.toLowerCase() ? (
        <>
          {/*} Create Ballot */}

          <CreateBallot>
            <div>
              <h2>Create ballot</h2>

              <StyledForm onSubmit={(e) => createBallot(e)}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    placeholder="e.g., What do you choose?"
                    type="text"
                    className="form-control"
                    id="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="choices">Choices</label>
                  <input
                    placeholder="e.g., choice1, choice2, choice3"
                    type="text"
                    className="form-control"
                    id="choices"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="duration">Duration (s)</label>
                  <input
                    placeholder="e.g., 180"
                    type="text"
                    className="form-control"
                    id="duration"
                  />
                </div>
                <StyledButton
                  type="submit"
                  className="btn btn-primary"
                >
                  Submit
                </StyledButton>
              </StyledForm>
            </div>
          </CreateBallot>

          {/*} Add Voters */}

          <AddVoters>
            <div>
              <h2>Add voters</h2>
              <StyledForm onSubmit={(e) => addVoters(e)}>
                <div className="form-group">
                  <label htmlFor="voters">Voters</label>
                  <input
                    placeholder="enter voter address"
                    type="text"
                    className="form-control"
                    id="voters"
                  />
                </div>
                <StyledButton
                  type="submit"
                  className="btn btn-primary"
                >
                  Submit
                </StyledButton>
              </StyledForm>
            </div>
          </AddVoters>
        </>
      ) : null}

      {/*} Votes List */}
      <Box>
        <Table>
          <h2>Votes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Votes</th>
                <th>Vote</th>
                <th>Ends on</th>
              </tr>
            </thead>
            <tbody>
              {ballots.map((ballot) => (
                <tr key={ballot.id}>
                  <td>{ballot.id}</td>
                  <td>{ballot.name}</td>
                  <td>
                    <ul>
                      {ballot.choices.map((choice) => (
                        <li key={choice.id}>
                          id: {choice.id}, name: {choice.name}, votes:{" "}
                          {choice.votes}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {isFinished(ballot) ? (
                      "Vote finished"
                    ) : ballot.hasVoted ? (
                      "You already voted"
                    ) : (
                      <form onSubmit={(e) => vote(e, ballot.id)}>
                        <div className="form-group">
                          <label htmlFor="choice">Choice</label>
                          <select
                            className="form-control"
                            id="choice"
                          >
                            {ballot.choices.map((choice) => (
                              <option
                                key={choice.id}
                                value={choice.id}
                              >
                                {choice.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          Submit
                        </button>
                      </form>
                    )}
                  </td>
                  <td>
                    {new Date(
                      parseInt(ballot.end) * 1000
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
      </Box>
    </div>
  );
}

const StyledLogo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .icon {
    font-size: 2.8rem;
    margin: 0 0.8rem;
    height: 1.8rem;
  }
`;

const CreateBallot = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 60vw;
  align-items: flex-start;

  .form-group {
    display: flex;
    flex-direction: column;
    max-width: 60vw;
    margin: 0.7rem 0;

    label {
      margin: 0.3rem 0;
    }

    input {
      width: 30rem;
      font-size: 1.3rem;
      padding: 0.2rem;

      &::-webkit-input-placeholder {
        opacity: 0.3; /*Change the opacity between 0 and 1*/
      }
    }
  }
`;

const StyledButton = styled.button`
  border: none;
  background: #6c7ae0;
  color: white;
  padding: 0.6rem;
  font-size: 1rem;
  border-radius: 0.3rem;
  align-self: center;
  margin: 0.5rem;
`;

const AddVoters = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const Box = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 1.5rem 0;
`;

const Table = styled.div`
  button {
    margin: 0.4rem;
  }

  h2 {
    font-family: "Roboto", sans-serif;
  }

  th,
  td {
    padding: 1.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: #6c7ae0;
    text-align: left;
    font-weight: normal;
    font-size: 1.1rem;
    color: white;
  }

  tr:nth-child(even) td {
    background: #f8f6ff;
  }
`;

export default App;
