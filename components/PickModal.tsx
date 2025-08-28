import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

export default function PickModal({ visible, onClose, onSubmit, game, currentPick, groups = [] }: PickModalProps) {
  const [selectedPick, setSelectedPick] = useState(currentPick || '');
  const [confidence, setConfidence] = useState('Medium');
  const [reasoning, setReasoning] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(groups);
  const [pickType, setPickType] = useState(groups.length > 0 ? 'group' : 'solo');

  const confidenceLevels = ['Low', 'Medium', 'High'];
  const availableGroups = ['Work Friends', 'Family Picks', 'College Buddies'];

  const handleSubmit = () => {
    onSubmit({
      pick: selectedPick,
      confidence,
      reasoning,
      groups: pickType === 'group' ? selectedGroups : [],
      type: pickType,
    });
    onClose();
  };

  const toggleGroup = (group: string) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter(g => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
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

          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>{game.awayTeam} @ {game.homeTeam}</Text>
            <Text style={styles.gameTime}>{game.time}</Text>
          </View>

          <View style={styles.pickSection}>
            <Text style={styles.sectionTitle}>Select Your Pick</Text>
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

          <View style={styles.pickTypeSection}>
            <Text style={styles.sectionTitle}>Pick Type</Text>
            <View style={styles.pickTypeOptions}>
              <TouchableOpacity
                style={[styles.typeButton, pickType === 'solo' && styles.typeButtonSelected]}
                onPress={() => setPickType('solo')}
              >
                <Text style={styles.typeIcon}>🎯</Text>
                <Text style={[styles.typeText, pickType === 'solo' && styles.typeTextSelected]}>
                  Solo Pick
                </Text>
                <Text style={styles.typeDescription}>Personal tracking only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, pickType === 'group' && styles.typeButtonSelected]}
                onPress={() => setPickType('group')}
              >
                <Text style={styles.typeIcon}>👥</Text>
                <Text style={[styles.typeText, pickType === 'group' && styles.typeTextSelected]}>
                  Group Pick
                </Text>
                <Text style={styles.typeDescription}>Share with friends</Text>
              </TouchableOpacity>
            </View>
          </View>

          {pickType === 'group' && (
            <View style={styles.groupSection}>
              <Text style={styles.sectionTitle}>Share with Groups</Text>
              {availableGroups.map(group => (
                <TouchableOpacity
                  key={group}
                  style={styles.groupOption}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={styles.checkbox}>
                    {selectedGroups.includes(group) ? '☑️' : '⬜'}
                  </Text>
                  <Text style={styles.groupName}>{group}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.confidenceSection}>
            <Text style={styles.sectionTitle}>Confidence Level</Text>
            <View style={styles.confidenceOptions}>
              {confidenceLevels.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.confidenceButton, confidence === level && styles.confidenceButtonSelected]}
                  onPress={() => setConfidence(level)}
                >
                  <Text style={[styles.confidenceText, confidence === level && styles.confidenceTextSelected]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.reasoningSection}>
            <Text style={styles.sectionTitle}>Your Reasoning (Optional)</Text>
            <TextInput
              style={styles.reasoningInput}
              placeholder="Why do you think this pick will hit?"
              placeholderTextColor="#8E8E93"
              value={reasoning}
              onChangeText={setReasoning}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !selectedPick && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedPick}
          >
            <Text style={styles.submitButtonText}>Submit Pick</Text>
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
  pickTypeSection: {
    marginBottom: 20,
  },
  pickTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeTextSelected: {
    color: '#FF6B35',
  },
  typeDescription: {
    color: '#8E8E93',
    fontSize: 11,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    fontSize: 20,
    marginRight: 12,
  },
  groupName: {
    color: '#FFF',
    fontSize: 16,
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  confidenceButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confidenceButtonSelected: {
    backgroundColor: '#FF6B35',
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confidenceTextSelected: {
    color: '#FFF',
  },
  reasoningSection: {
    marginBottom: 20,
  },
  reasoningInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
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