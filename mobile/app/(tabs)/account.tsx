import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function AccountScreen() {
  return (
    <ScrollView className='flex-1 bg-paper p-5'>
      <View className='mt-12 rounded-[26px] border-[3px] border-ink bg-white p-5 shadow-punch'>
        <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Account</Text>
        <Text className='mt-3 text-2xl font-black uppercase text-ink'>Aryan Patel</Text>
      </View>

      <View className='mt-6 gap-3'>
        <Link href='/account/profile' asChild>
          <View className='rounded-[18px] border-[3px] border-ink bg-white p-4 shadow-punch'>
            <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Profile</Text>
          </View>
        </Link>
        <Link href='/account/bank-accounts' asChild>
          <View className='rounded-[18px] border-[3px] border-ink bg-white p-4 shadow-punch'>
            <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Bank accounts</Text>
          </View>
        </Link>
        <Link href='/account/withdrawals' asChild>
          <View className='rounded-[18px] border-[3px] border-ink bg-white p-4 shadow-punch'>
            <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink'>Withdrawals</Text>
          </View>
        </Link>
      </View>
    </ScrollView>
  );
}
