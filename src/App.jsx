import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { web3Enable, web3Accounts, web3FromSource } from '@polkadot/extension-dapp';
import zkVerifyLogo from './assets/zk_Verify_logo_full_white.svg';

function App() {
    // Substrate state
    const [substrateAccounts, setSubstrateAccounts] = useState([]);
    const [selectedSubstrateAccount, setSelectedSubstrateAccount] = useState(null);
    const [substrateStatus, setSubstrateStatus] = useState('Not Connected');

    // EVM state (from wagmi/rainbowkit)
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    // App logic state
    const [allBindings, setAllBindings] = useState([]);
    const [canBind, setCanBind] = useState(false);

    // Update 'canBind' status whenever wallet connections change
    useEffect(() => {
        setCanBind(!!selectedSubstrateAccount && isEvmConnected);
    }, [selectedSubstrateAccount, isEvmConnected]);

    const handleConnectSubstrate = async () => {
        try {
            const extensions = await web3Enable('Address Binder DApp');
            if (extensions.length === 0) {
                alert('No Substrate wallet extension found. Please install one and refresh the page.');
                return;
            }
            const accounts = await web3Accounts();
            if (accounts.length === 0) {
                alert('No accounts found in your Substrate wallet.');
                return;
            }
            setSubstrateAccounts(accounts);
            setSelectedSubstrateAccount(accounts[0]);
            setSubstrateStatus('Connected');
        } catch (error) {
            console.error("Substrate connection error:", error);
            alert(`Error connecting to Substrate wallet: ${error.message}`);
        }
    };

    const handleSubstrateAccountChange = (e) => {
        const selectedAddress = e.target.value;
        const account = substrateAccounts.find(acc => acc.address === selectedAddress);
        setSelectedSubstrateAccount(account);
    };

    const handleBind = async () => {
        if (!canBind) {
            alert('Please ensure both Substrate and EVM wallets are connected.');
            return;
        }

        try {
            const message = `I am binding my Substrate address: ${selectedSubstrateAccount.address} to this EVM address for loyalty program activities.`;
            const signature = await signMessageAsync({ message });

            const binding = {
                substrateAddress: selectedSubstrateAccount.address,
                evmAddress: evmAddress,
                signature: signature,
                signedMessage: message,
                timestamp: new Date().toISOString()
            };

            setAllBindings(prev => [...prev, binding]);

            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            fetch(`${backendUrl}/add-binding`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(binding),
            })
              .then(response => response.text())
              .then(data => {
                console.log('Binding saved to backend:', data);
              })
              .catch(error => {
                console.error('Error saving binding to backend:', error);
              });
        } catch (error) {
            console.error("Binding error:", error);
            alert(`Failed to generate signature: ${error.message}`);
        }
    };

    return (
        <div className="bg-black text-white flex items-center justify-center min-h-screen p-4 font-sans">
            <div className="w-full max-w-2xl bg-zinc-900 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 border border-zinc-800">
                
                <header className="flex flex-col items-center space-y-2 pb-2 border-b border-zinc-800 mb-2">
                    <img src={zkVerifyLogo} alt="zkVerify Logo" className="h-12 md:h-16 w-auto mb-1" />
                    <h1 className="text-3xl font-bold text-center text-green-400 tracking-tight">Address Binder</h1>
                    <p className="text-center text-gray-400 mt-1">Cryptographically link your Substrate and EVM addresses.</p>
                </header>

                {/* Step 1: Substrate Wallet */}
                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-green-500/20 text-green-400 rounded-full font-bold">1</div>
                            <h2 className="text-lg font-semibold">Connect Substrate Wallet</h2>
                        </div>
                        {substrateStatus !== 'Connected' && (
                            <button onClick={handleConnectSubstrate} className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                Connect
                            </button>
                        )}
                    </div>
                    {substrateStatus === 'Connected' && (
                         <div className="text-gray-400 mt-3 text-sm">
                            <p>Status: <span className="font-medium text-green-400">Connected</span></p>
                            <p className="break-all font-mono text-xs mt-1">Address: {selectedSubstrateAccount?.address}</p>
                            <select onChange={handleSubstrateAccountChange} value={selectedSubstrateAccount?.address} className="mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white">
                                {substrateAccounts.map(account => (
                                    <option key={account.address} value={account.address}>
                                        {account.meta.name} ({account.address.substring(0, 6)}...{account.address.substring(account.address.length - 6)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Step 2: EVM Wallet */}
                 <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-green-500/20 text-green-400 rounded-full font-bold">2</div>
                            <h2 className="text-lg font-semibold">Connect EVM Wallet</h2>
                        </div>
                        <ConnectButton />
                    </div>
                </div>

                {/* Step 3: Generate Binding */}
                <div className="text-center pt-4">
                    <button onClick={handleBind} disabled={!canBind} className={`bg-green-500 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg ${!canBind ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}>
                        Generate Binding Signature
                    </button>
                </div>

                {/* Results Section */}
                {allBindings.length > 0 && (
                    <div className="pt-4 space-y-4">
                        <h3 className="text-xl font-semibold text-center">Generated Bindings</h3>
                        <div className="bg-black rounded-lg p-4 max-h-60 overflow-y-auto border border-zinc-800">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(allBindings, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App; 