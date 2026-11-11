import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AuthModal } from '../../components/AuthModal';
import { useAuth } from '../../context/AuthContext';

export default function AccountScreen() {
  const { user, isLoggedIn, logoutUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const displayName = user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'Guest';

  return (
    <>
      <ScrollView className='flex-1 bg-paper p-5'>
        <View className='mt-12 rounded-[26px] border-[3px] border-ink bg-white p-5 shadow-punch'>
          <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Account</Text>
          <Text className='mt-3 text-2xl font-black uppercase text-ink'>{displayName}</Text>
          {!isLoggedIn ? (
            <Text className='mt-2 text-sm font-bold uppercase tracking-[0.12em] text-ink/60'>Login to access your wallet and account</Text>
          ) : null}
        </View>

        {!isLoggedIn ? (
          <View className='mt-6'>
            <Text
              className='rounded-[18px] border-[3px] border-ink bg-[#ff3d8c] p-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white shadow-punch'
              onPress={() => setIsAuthModalOpen(true)}
            >
              Login / Signup
            </Text>
          </View>
        ) : (
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
            <View className='mt-2 rounded-[18px] border-[3px] border-ink bg-[#ffe1e7] p-4 shadow-punch'>
              <Text className='text-sm font-black uppercase tracking-[0.18em] text-ink' onPress={() => void logoutUser()}>Logout</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
