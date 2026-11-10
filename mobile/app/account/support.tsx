import { ScrollView, Text, View } from 'react-native';

export default function SupportScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Support</Text>
      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-sm text-ink/70'>Need help? Reach us through the app support flow.</Text>
      </View>
    </ScrollView>
  );
}
