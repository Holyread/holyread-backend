export const responseMessage = {
    appResponse: {
        corsError: 'Access denied by CORS',
    },
    passportResponse: {
        accessTokenMissingError: 'Access token missing in header',
    },
    authControllerResponse: {
        loginSuccess: 'User login successfully',
        signUpSuccess: 'User signUp successfully',
        userUpdateSuccess: 'User updated successfully',
        userAlreadyExistError: 'User Already exist', 
        getUserSuccess: 'User fetched successfully',
        getUsersSuccess: 'All user fetched successfully',
        getUserError: 'User does not exist',
        userNotAuthorizationError: 'User not authorized',
        userInvalidPasswordError: 'Password is incorrect',
        passwordUpdateSuccess: 'Password changed successfully',
        parentIdMissingError: 'ParentId is missing',
        getParentDetailsError: 'Parent details not found',
        childDependencyError: 'User can not deleted due to have childs',
        deleteUserSuccess: 'User deleted successfully',
        createUserFailed: 'Failed to create user'
    },
    adminControllerResponse: {
        createUserSuccess: 'User added successfully',
        createAdminSuccess: 'Admin added successfully',
        updateAdminSuccess: 'Admin updated successfully',
        deleteAdminSuccess: 'Admin deleted successfully',
        fetchAdminSuccess: 'Admin details fetched successfully',
        createAdminFailure: 'Failed to add admin',
        getAdminFailure: 'Failed to fetch admin details',
        sendCodeSuccess: 'Verification code successfully sent on your email',
        forgotPassowrdFailure: 'Failed to proceed your request, try again',
        forgotPassowrdSuccess: 'Password updated successfully'
    },
    subscriptionsControllerResponse: {
        createSubscriptionSuccess: 'Subscription added successfully',
        updateSubscriptionSuccess: 'Subscription updated successfully',
        deleteSubscriptionSuccess: 'Subscription deleted successfully',
        fetchSubscriptionSuccess: 'Subscription details fetched successfully',
        fetchSubscriptionsSuccess: 'Subscriptions details fetched successfully',
        createSubscriptionFailure: 'Failed to add subscription',
        getSubscriptionFailure: 'Failed to fetch subscription details',
    },
    dashboardControllerResponse: {
        getDashboardSuccess: 'Dashboard details fetched successfully'
    },   
}
