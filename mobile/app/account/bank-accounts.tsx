import { ScrollView, Text, View } from 'react-native';

export default function BankAccountsScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Bank accounts</Text>
      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>HDFC Bank</Text>
        <Text className='mt-2 text-sm text-ink/70'>•••• 2845</Text>
      </View>
    </ScrollView>
  );
}
