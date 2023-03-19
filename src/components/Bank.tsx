// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";

import { Program, AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import idl from "./solanapdas.json";
import { PublicKey } from '@solana/web3.js';
import { connect } from 'http2';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.metadata.address);

export const Bank: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection();
    const [banks, setBanks] = useState([]);

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    }

    const createBank = async () => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);
           // console.log("testpass1");
            const [bank] = await PublicKey.findProgramAddressSync([utils.bytes.utf8.encode("bankaccount"), anchProvider.wallet.publicKey.toBuffer()], program.programId);
          //  console.log("testpass2");
            await program.rpc.create("WsoS Bank", {
                accounts: {
                    bank,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });
            
            console.log("New Bank has been created:" + bank.toString());
        }
        catch (error) {
            console.log("Error creating bank:(" + error);
        }
    }

    const getBanks = async () => {
        const anchProvider = getProvider();
        const program = new Program(idl_object, programID, anchProvider);
        try {
            Promise.all((await connection.getProgramAccounts(programID)).map(async bank => ({
                ...(await program.account.bank.fetch(bank.pubkey)),
                pubkey: bank.pubkey

            }))).then(banks => {
                console.log(banks);
                setBanks(banks);
            })
        }
        catch (error) {
            console.log("Error while retrieving banks" + error);
        }
    }

    const depositBank = async (publicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);
            await program.rpc.deposit(new BN(0.1 * web3.LAMPORTS_PER_SOL), {
                accounts: {
                    bank: publicKey,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });
            console.log("Deposited 0.1 sol:" + publicKey);
        } catch (error) {
            console.error("Error while depositing");
        }
    }

    const withdrawBank = async (publicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);
            await program.rpc.withdraw(new BN(0.1 * web3.LAMPORTS_PER_SOL), {
                accounts: {
                    bank: publicKey,
                    user: anchProvider.wallet.publicKey,
                }
            });
            console.log("Withdrew 0.1 sol:" + publicKey);
        } catch (error) {
            console.error("Error while withdrawing");
        }
    }

    return (
        <>
            {banks.map((bank) => {
                return (
                    <div className="md:hero-content flex flex-col">
                        <h1>{bank.name.toString()}</h1>
                        <span>{bank.balance.toString()}</span>
                        <span>{bank.owner.toString()}</span>

                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => depositBank(bank.pubkey)}
                        >
                            <span>
                                Deposit 0.1 SOL
                            </span>
                        </button>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => withdrawBank(bank.pubkey)}
                        >
                            <span>
                                Withdraw 0.1 SOL
                            </span>
                        </button>
                    </div>
                )
            })}
            <div className="flex flex-row justify-center">
                <>
                    <div className="relative group items-center">
                        
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={createBank}
                        >
                            <span className="block group-disabled:hidden">
                                Create Bank
                            </span>
                        </button>

                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={getBanks}
                        >
                            <span className="block group-disabled:hidden">
                                Fetch Banks
                            </span>
                        </button>
                    </div>
                </>
            </div>
        </>
    );
};
