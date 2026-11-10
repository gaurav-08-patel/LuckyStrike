import { ScrollView, Text, View } from 'react-native';

export default function WalletScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <View className='mt-12 rounded-[28px] border-[3px] border-ink bg-[#fff7dc] p-5 shadow-punch'>
        <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Wallet</Text>
        <Text className='mt-3 text-4xl font-black text-ink'>₹2,500</Text>
        <Text className='mt-2 text-sm text-ink/70'>Available balance</Text>
      </View>

      <View className='mt-6 rounded-[24px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Top up</Text>
        <Text className='mt-2 text-sm text-ink/70'>Add funds to continue buying tickets and managing your account.</Text>
      </View>
    </ScrollView>
  );
}
