import { ScrollView, Text, View } from 'react-native';

export default function MyTicketsScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <View className='mt-12 rounded-[24px] border-[3px] border-ink bg-[#fff1b8] p-5 shadow-punch'>
        <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>My tickets</Text>
        <Text className='mt-3 text-2xl font-black uppercase text-ink'>2 active</Text>
      </View>

      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-white p-4 shadow-punch'>
        <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Draw #LS-1204</Text>
        <Text className='mt-2 text-sm text-ink/70'>Ticket code: LS-1204-01</Text>
      </View>
    </ScrollView>
  );
}
