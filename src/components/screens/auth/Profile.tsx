import { useAuth } from "@/src/components/context/AuthSessionProvider";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useProfileHandlers } from "@/src/hooks/useProfileHandlers";
import { useState, useCallback } from "react";
import {
  ScrollView,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ProfileHeader } from "../common/Profile/ProfileHeader";
import { SecuritySettingsSection } from "../common/Profile/SecuritySettingsSection";
import { LimitSettingsSection } from "../common/Profile/LimitSettingsSection";
import { NotificationsSection } from "../common/Profile/NotificationsSection";
import { DeleteAccountSection } from "../common/Profile/DeleteAccountSection";
import { EditProfileModal } from "../common/Profile/EditProfileModal";
import { PinChangeModal } from "../common/Profile/PinChangeModal";
import { DeleteAccountModal } from "../common/Profile/DeleteAccountModal";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    user,
    logout,
    nativeAuthLogin,
    nativeAuthTransactions,
    visibleBalance,
    updateNativeAuthSettings,
    updateVisibleBalance,
  } = useAuth();

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Use profile handlers hook
  const {
    pinState: { oldPin, newPin, confirmPin, pinStep, setOldPin, setNewPin, setConfirmPin },
    handlePinChange,
    handleBiometricLoginToggle,
    handleTransactionSecurityToggle,
    handleLogout,
    handleDeleteAccount,
    handleEdit,
    handleSaveDetails,
    editedFirstName,
    setEditedFirstName,
    editedLastName,
    setEditedLastName,
    resetPinState,
  } = useProfileHandlers({
    logout,
    updateNativeAuthSettings,
    nativeAuthLogin,
    nativeAuthTransactions,
    user,
  });

  const handleEditPress = useCallback(() => {
    handleEdit();
    setShowEditModal(true);
  }, [handleEdit]);

  const handleSaveDetailsPress = useCallback(() => {
    handleSaveDetails();
    setShowEditModal(false);
  }, [handleSaveDetails]);

  const handleDeleteAccountPress = useCallback(async () => {
    await handleDeleteAccount();
    setShowDeleteModal(false);
  }, [handleDeleteAccount]);

  const handleLogoutPress = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const handlePinClose = useCallback(() => {
    setShowPinModal(false);
    resetPinState();
  }, [resetPinState]);

  const handlePinSubmit = useCallback(async () => {
    await handlePinChange();
    if (pinStep === "new") {
      handlePinClose();
    }
  }, [handlePinChange, pinStep, handlePinClose]);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <ScreenHeader
        title="Profile"
        subtitle="Everything You"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-4">
          <ProfileHeader
            isDark={isDark}
            user={user}
            onEdit={handleEditPress}
            onLogout={handleLogoutPress}
          />

          <LimitSettingsSection isDark={isDark} />

          <SecuritySettingsSection
            isDark={isDark}
            nativeAuthLogin={nativeAuthLogin}
            onBiometricLoginToggle={handleBiometricLoginToggle}
            nativeAuthTransactions={nativeAuthTransactions}
            onTransactionSecurityToggle={handleTransactionSecurityToggle}
            visibleBalance={visibleBalance}
            onVisibleBalanceToggle={updateVisibleBalance}
            onPinPress={() => setShowPinModal(true)}
          />

          <NotificationsSection isDark={isDark} />

          <DeleteAccountSection
            isDark={isDark}
            onDelete={() => setShowDeleteModal(true)}
          />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        isDark={isDark}
        editedFirstName={editedFirstName}
        setEditedFirstName={setEditedFirstName}
        editedLastName={editedLastName}
        setEditedLastName={setEditedLastName}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveDetailsPress}
      />

      <PinChangeModal
        visible={showPinModal}
        isDark={isDark}
        pinStep={pinStep}
        oldPin={oldPin}
        setOldPin={setOldPin}
        newPin={newPin}
        setNewPin={setNewPin}
        confirmPin={confirmPin}
        setConfirmPin={setConfirmPin}
        onClose={handlePinClose}
        onSubmit={handlePinSubmit}
      />

      <DeleteAccountModal
        visible={showDeleteModal}
        isDark={isDark}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccountPress}
      />
    </SafeAreaView>
  );
}
