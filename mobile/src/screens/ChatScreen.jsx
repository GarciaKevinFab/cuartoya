import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

const MOCK_MESSAGES = [
  {
    id: '1',
    text: 'Hola! Vi tu publicacion de la habitacion en El Tambo. Sigue disponible?',
    sender: 'me',
    timestamp: '2026-03-19T09:00:00',
  },
  {
    id: '2',
    text: 'Hola! Si, la habitacion sigue disponible. Cuando te gustaria verla?',
    sender: 'other',
    timestamp: '2026-03-19T09:05:00',
  },
  {
    id: '3',
    text: 'Genial! Podria ser hoy por la tarde? Tipo 5pm?',
    sender: 'me',
    timestamp: '2026-03-19T09:10:00',
  },
  {
    id: '4',
    text: 'Perfecto! Te espero a las 5pm. La direccion es Jr. Los Alamos 234, El Tambo. Toca el timbre del 2do piso.',
    sender: 'other',
    timestamp: '2026-03-19T09:12:00',
  },
  {
    id: '5',
    text: 'Muchas gracias! Ahi estare.',
    sender: 'me',
    timestamp: '2026-03-19T09:15:00',
  },
  {
    id: '6',
    text: 'De nada! Cualquier duda me escribes. El precio incluye agua, luz e internet.',
    sender: 'other',
    timestamp: '2026-03-19T10:30:00',
  },
];

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const match = route?.params?.match || {
    otherUser: { name: 'Maria Garcia', verified: true },
    listingTitle: 'Habitacion amoblada cerca a la UNCP',
    price: 350,
  };
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContent}>
          <Text style={styles.headerName} numberOfLines={1}>{match.otherUser.name}</Text>
          <Text style={styles.headerListing} numberOfLines={1}>
            {match.listingTitle}
          </Text>
        </View>
      ),
    });
  }, [navigation, match]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      text: trimmed,
      sender: 'me',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [newMessage, ...prev]);
    setInputText('');
  };

  const isNewDay = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    return !dayjs(currentMsg.timestamp).isSame(dayjs(previousMsg.timestamp), 'day');
  };

  const formatDay = (timestamp) => {
    const date = dayjs(timestamp);
    const today = dayjs();
    if (date.isSame(today, 'day')) return 'Hoy';
    if (date.isSame(today.subtract(1, 'day'), 'day')) return 'Ayer';
    return date.format('DD/MM/YYYY');
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender === 'me';
    const nextMessage = messages[index + 1];
    const showDate = isNewDay(item, nextMessage);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{formatDay(item.timestamp)}</Text>
            </View>
          </View>
        )}
        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
          {!isMe && (
            <View style={styles.messageBubbleAvatar}>
              <Ionicons name="person" size={14} color="#9CA3AF" />
            </View>
          )}
          <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
              {item.text}
            </Text>
            <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
              {dayjs(item.timestamp).format('HH:mm')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.listingBanner}>
        <View style={styles.bannerImage}>
          <Ionicons name="home" size={18} color="#D1D5DB" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle} numberOfLines={1}>{match.listingTitle}</Text>
          <Text style={styles.bannerPrice}>S/ {match.price}/mes</Text>
        </View>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => navigation.navigate('ListingDetail', { listing: match })}
        >
          <Text style={styles.bannerButtonText}>Ver</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerListing: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 200,
  },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bannerImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  bannerPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8442A',
  },
  bannerButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E8442A',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#E8442A',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeOther: {
    color: '#9CA3AF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attachButton: {
    padding: 6,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8442A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
