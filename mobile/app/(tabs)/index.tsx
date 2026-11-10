import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <View className='mt-12 flex-row items-center justify-between'>
        <Text className='text-3xl font-black uppercase text-ink'>Lucky<Text className='text-pink'>Strike</Text></Text>
      </View>

      <View className='mt-6 rounded-[28px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Live draws</Text>
        <Text className='mt-3 text-2xl font-black uppercase text-ink'>Big win season</Text>
        <Text className='mt-2 text-sm text-ink/70'>Featured giveaways, tickets, and wallet updates.</Text>
      </View>

      <View className='mt-6 flex-row flex-wrap gap-3'>
        <Link href='/campaigns' asChild>
          <View className='rounded-full border-[3px] border-ink bg-pink px-4 py-3 shadow-punch'>
            <Text className='text-xs font-black uppercase tracking-[0.18em] text-white'>Browse campaigns</Text>
          </View>
        </Link>
        <Link href='/winners' asChild>
          <View className='rounded-full border-[3px] border-ink bg-white px-4 py-3 shadow-punch'>
            <Text className='text-xs font-black uppercase tracking-[0.18em] text-ink'>Winners</Text>
          </View>
        </Link>
      </View>
    </ScrollView>
  );
}
