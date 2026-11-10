import { ScrollView, Text, View } from 'react-native';

export default function WinnersScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Winners</Text>

      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-[#dff7e7] p-5 shadow-punch'>
        <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Latest</Text>
        <Text className='mt-3 text-xl font-black uppercase text-ink'>Priya R.</Text>
      </View>
    </ScrollView>
  );
}
