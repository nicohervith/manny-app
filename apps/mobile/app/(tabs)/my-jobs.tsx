import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import DisputeModal from "../../src/components/DisputeModal";
import MyJobCard from "../../src/components/MyJobCard";
import RatingModal from "../../src/components/RatingModal";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";
import { DisputeModalState, Job, RatingModalState } from "../../src/types/job";

export default function MyJobsScreen() {
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState<RatingModalState>({
    visible: false,
    selectedJob: null,
    rating: 5,
    comment: "",
  });

  // Dispute Modal state
  const [disputeModal, setDisputeModal] = useState<DisputeModalState>({
    visible: false,
    disputeJob: null,
    disputeReason: "",
    submittingDispute: false,
  });

  const handleDispute = (job: Job) => {
    setDisputeModal({
      ...disputeModal,
      visible: true,
      disputeJob: job,
    });
  };

  const handleRating = (job: Job) => {
    setRatingModal({
      ...ratingModal,
      visible: true,
      selectedJob: job,
    });
  };

  const closeRatingModal = () => {
    setRatingModal({
      visible: false,
      selectedJob: null,
      rating: 5,
      comment: "",
    });
  };

  const closeDisputeModal = () => {
    setDisputeModal({
      visible: false,
      disputeJob: null,
      disputeReason: "",
      submittingDispute: false,
    });
  };

  const fetchMyJobs = async () => {
    try {
      const res = await api.get(`/api/jobs/client/${user.id}`);
      setMyJobs(res.data);
    } catch (e) {
      console.error("Error fetching jobs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Pedidos</Text>

      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <MyJobCard
            item={item}
            onDisputePress={handleDispute}
            onRatingPress={handleRating}
            onRefresh={fetchMyJobs}
          />
        )}
      />

      <RatingModal
        visible={ratingModal.visible}
        selectedJob={ratingModal.selectedJob}
        rating={ratingModal.rating}
        comment={ratingModal.comment}
        onClose={closeRatingModal}
        onRatingChange={(rating) => setRatingModal({ ...ratingModal, rating })}
        onCommentChange={(comment) =>
          setRatingModal({ ...ratingModal, comment })
        }
        onSuccess={fetchMyJobs}
      />

      <DisputeModal
        visible={disputeModal.visible}
        disputeJob={disputeModal.disputeJob}
        disputeReason={disputeModal.disputeReason}
        onClose={closeDisputeModal}
        onReasonChange={(reason) =>
          setDisputeModal({ ...disputeModal, disputeReason: reason })
        }
        onSuccess={fetchMyJobs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 15 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop: 20,
  },
});
