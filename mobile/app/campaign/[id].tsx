import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className='flex-1 bg-paper p-5 justify-center'>
      <Text className='text-xs font-black uppercase tracking-[0.2em] text-ink/60'>Campaign detail</Text>
      <Text className='mt-3 text-3xl font-black uppercase text-ink'>{id}</Text>
    </View>
  );
}
