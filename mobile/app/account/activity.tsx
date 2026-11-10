import { ScrollView, Text, View } from 'react-native';

export default function ActivityScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Activity</Text>
      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-sm text-ink/70'>Top up completed</Text>
        <Text className='mt-2 text-sm font-black uppercase text-ink'>₹500</Text>
      </View>
    </ScrollView>
  );
}
