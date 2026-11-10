import { ScrollView, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Profile</Text>
      <View className='mt-5 rounded-[24px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-sm text-ink/70'>Name: Aryan Patel</Text>
        <Text className='mt-2 text-sm text-ink/70'>Phone: +91 9876543210</Text>
      </View>
    </ScrollView>
  );
}
