import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PickModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pick: any) => void;
  game: {
    homeTeam: string;
    awayTeam: string;
    spread: { home: string; away: string };
    time: string;
  };
  currentPick?: string;
  groups?: string[];
}

export default function PickModal({ visible, onClose, onSubmit, game, currentPick }: PickModalProps) {
  const [selectedPick, setSelectedPick] = useState(currentPick || '');
  const [pickType, setPickType] = useState('group'); // Default to group
  const [showHelp, setShowHelp] = useState(false);

  const SYNDICATE = 'The Syndicate'; // Hardcoded single group

  const handleSubmit = () => {
    onSubmit({
      pick: selectedPick,
      confidence: 'Medium',
      reasoning: '',
      groups: pickType === 'group' ? [SYNDICATE] : [],
      type: pickType,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Make Your Pick</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {showHelp && (
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>How Picks Work:</Text>
              <Text style={styles.helpText}>• Solo picks are just for you to track</Text>
              <Text style={styles.helpText}>• Group picks are shared with {SYNDICATE}</Text>
              <Text style={styles.helpText}>• All picks lock when the game starts</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Text style={styles.helpClose}>Got it!</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>{game.awayTeam} @ {game.homeTeam}</Text>
            <Text style={styles.gameTime}>{game.time}</Text>
          </View>

          <View style={styles.pickSection}>
            <Text style={styles.sectionTitle}>Who wins against the spread?</Text>
            <View style={styles.pickOptions}>
              <TouchableOpacity
                style={[styles.pickButton, selectedPick === 'away' && styles.pickButtonSelected]}
                onPress={() => setSelectedPick('away')}
              >
                <Text style={[styles.pickButtonText, selectedPick === 'away' && styles.pickButtonTextSelected]}>
                  {game.spread.away}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickButton, selectedPick === 'home' && styles.pickButtonSelected]}
                onPress={() => setSelectedPick('home')}
              >
                <Text style={[styles.pickButtonText, selectedPick === 'home' && styles.pickButtonTextSelected]}>
                  {game.spread.home}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.shareSection}>
            <View style={styles.shareSectionHeader}>
              <Text style={styles.sectionTitle}>How do you want to track this?</Text>
              <TouchableOpacity onPress={() => setShowHelp(true)}>
                <Text style={styles.helpLink}>What's the difference?</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={[styles.shareButton, pickType === 'solo' && styles.shareButtonSelected]}
                onPress={() => setPickType('solo')}
              >
                <Text style={styles.shareIcon}>🎯</Text>
                <Text style={[styles.shareText, pickType === 'solo' && styles.shareTextSelected]}>
                  Just for me
                </Text>
                <Text style={styles.shareSubtext}>Private tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.shareButton, pickType === 'group' && styles.shareButtonSelected]}
                onPress={() => setPickType('group')}
              >
                <Text style={styles.shareIcon}>👥</Text>
                <Text style={[styles.shareText, pickType === 'group' && styles.shareTextSelected]}>
                  Share with {SYNDICATE}
                </Text>
                <Text style={styles.shareSubtext}>Discuss with everyone</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !selectedPick && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedPick}
          >
            <Text style={styles.submitButtonText}>
              {pickType === 'solo' ? 'Save Pick' : `Share with ${SYNDICATE}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#FFF',
    fontSize: 24,
  },
  helpCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  helpTitle: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  helpClose: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  shareSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpLink: {
    color: '#FF6B35',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  shareSection: {
    marginBottom: 20,
  },
  shareOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  shareIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  shareText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shareTextSelected: {
    color: '#FF6B35',
  },
  shareSubtext: {
    color: '#8E8E93',
    fontSize: 11,
  },
  gameInfo: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  pickSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonSelected: {
    backgroundColor: '#FF6B35',
  },
  pickButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickButtonTextSelected: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});