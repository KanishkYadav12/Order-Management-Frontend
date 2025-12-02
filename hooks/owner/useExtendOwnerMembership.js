import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast"; // Import ShadCN's toast hook
import { approveHotelOwner, extendOwnerMembership } from "@/redux/actions/owner";
import { ownerActions } from "@/redux/slices/ownerSlice";

export const useExtendOwnerMembership = (setSelectedUserId) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const { status, error, data } = useSelector((state) => state.owner.extendOwnerMembership);
    const { toast } = useToast();

    useEffect(() => {
        if (status === "pending") {
            setLoading(true);
        } else if (status === "success") {
            setLoading(false);
            toast({
                title: "Success",
                description: "Membership Extended successfully.",
                variant: "success", // Optional, for success styling
            });
            dispatch(ownerActions.clearExtendOwnerMembershipStats());
            setSelectedUserId(null)
        } else if (status === "failed") {
            setLoading(false);
            toast({
                title: "Error",
                description: error || "Failed to a Extend Membership.",
                variant: "destructive", // Optional, for error styling
            });
            dispatch(ownerActions.clearExtendOwnerMembershipStats());
            setSelectedUserId(null);
        }
    }, [status, error, dispatch, toast]);

    const handleExtendOwnerMembership = (hotelOwnerId, numberOfDays) => {
        console.log("hook-extend-membership-owner-req:", hotelOwnerId, numberOfDays);
        dispatch(extendOwnerMembership(hotelOwnerId, numberOfDays));
    };

    return { loading, handleExtendOwnerMembership };
};
