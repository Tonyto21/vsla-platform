import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, uploadPhoto } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      await uploadPhoto(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const photoUrl = user?.profile_photo 
    ? `http://localhost:5000${user.profile_photo}` 
    : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={user?.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary-600">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
              >
                <Camera className="h-5 w-5 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {uploading && <p className="text-white text-sm mt-2">Uploading...</p>}
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Full Name</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{user?.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Username</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Gender</label>
              <p className="mt-1 text-gray-900 capitalize">{user?.gender || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Group</label>
              <p className="mt-1 text-gray-900">{user?.group_name || 'No group assigned'}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => toast.success('Profile update feature coming soon!')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;