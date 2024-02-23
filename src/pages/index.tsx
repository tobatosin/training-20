import Image from 'next/image';
import { useAccount, useBalance, useDisconnect, useSimulateContract, useWriteContract } from 'wagmi';
import { Inter } from 'next/font/google';
import { NFTStorage } from 'nft.storage';
import { useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import { useState } from 'react';
import { ERC20ABI } from '../../utils/tokenAbi';

const inter = Inter({ subsets: ['latin'] });

const NFT_STORAGE_TOKEN = 'YOUR_API_KEY';
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

export default function Home() {
	const { isConnected, isConnecting, address } = useAccount();

	const { disconnect } = useDisconnect();

	// To Read Contracts using Wagmi
	const { data } = useReadContract({
		abi: ERC20ABI,
		functionName: 'balanceOf',
		args: [address],
		address: '0xA1761fcFDB320e79FAdcC5700B05b8AE2986aE5C',
	});

	// To Write Contracts using Wagmi
	const { data: simulatedContract } = useSimulateContract({
		abi: ERC20ABI,
		functionName: 'transferFrom',
		args: [address, '0x337a8b1f5aBd2A656255d7195c71C391248c893F', parseEther('40000')],
		address: '0xA1761fcFDB320e79FAdcC5700B05b8AE2986aE5C',
	});

	const { data: giveAllowance } = useSimulateContract({
		abi: ERC20ABI,
		functionName: 'approve',
		args: [address, parseEther('40000')],
		address: '0xA1761fcFDB320e79FAdcC5700B05b8AE2986aE5C',
	});

	const { writeContractAsync } = useWriteContract();

	// To Make Asynchorous calls to contracts
	const handleTransferFunds = async () => {
		try {
			const response = await writeContractAsync(giveAllowance!.request);

			if (response) {
				const sendToken = await writeContractAsync(simulatedContract!.request);
				console.log(sendToken);
			}
		} catch (error) {}
	};

	const balance = useBalance({
		address: address,
	});

	// Form to collect user inputs
	const [formData, setFormData] = useState<{ image: BlobPart | null; name: string; description: string }>({
		name: '',
		description: '',
		image: null,
	});

	//Function to update the form data

	const updateFormField = (field: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	//Function to upload data to IPFS

	async function handleUpload() {
		if (!formData.image || !formData.description || !formData.image) {
			return;
		}

		const imageFile = new File([formData.image], 'metadata-image', { type: 'image/png' });
		const metadata = await client.store({
			name: formData.name,
			description: formData.description,
			image: imageFile,
		});
	}

	if (isConnecting) return <p>Loading...</p>;

	if (!isConnected)
		return (
			<div>
				<p>Please connect your wallet</p>
				<ConnectButton />
			</div>
		);

	return (
		<main className={` min-h-screen    p-24 ${inter.className}`}>
			<p>{address}</p>

			{balance?.data && <p>Balance : {formatEther(balance.data?.value)}</p>}
			<input
				type="file"
				accept="image/png, image/jpeg"
				onChange={(event) => {
					updateFormField('image', event.target.files?.[0]);
				}}
			/>
			<div>
				<input
					type="text"
					className="text-black"
					placeholder="Enter name"
					value={formData.name}
					onChange={(event) => {
						updateFormField('name', event.target.value);
					}}
				/>
			</div>
			<div className="my-4">
				<input
					placeholder="Enter Description"
					type="text"
					className="text-black"
					value={formData.description}
					onChange={(event) => {
						updateFormField('description', event.target.value);
					}}
				/>
			</div>
			<button onClick={handleTransferFunds}>Claim token</button>
			<div>
				<button className="bg-blue-400" onClick={() => handleUpload()}>
					Upload file
				</button>
			</div>
			<button
				onClick={() => {
					disconnect();
				}}
			>
				Disconnect Account
			</button>
		</main>
	);
}
