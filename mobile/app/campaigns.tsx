import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function CampaignsScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <Text className='mt-12 text-2xl font-black uppercase text-ink'>Campaigns</Text>

      <Link href='/campaign/raffle-101' asChild>
        <View className='mt-5 rounded-[26px] border-[3px] border-ink bg-white p-5 shadow-punch'>
          <Text className='text-xs font-black uppercase tracking-[0.18em] text-pink'>Monthly draw</Text>
          <Text className='mt-3 text-xl font-black uppercase text-ink'>Luxury car giveaway</Text>
        </View>
      </Link>
    </ScrollView>
  );
}
