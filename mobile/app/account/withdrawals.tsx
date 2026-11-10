import { ScrollView, Text, View } from 'react-native';

export default function WithdrawalsScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Withdrawals</Text>
      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-[#fff7dc] p-5 shadow-punch'>
        <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Pending</Text>
        <Text className='mt-2 text-xl font-black text-ink'>₹1,200</Text>
      </View>
    </ScrollView>
  );
}
