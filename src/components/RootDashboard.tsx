import React, { useEffect, useState } from "react";
import { authApi, type User } from "../services/authApi";

const RootDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await authApi.getAllUsers();
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const rootAdmins = users.filter((u) => u.type === "ROOTADMIN");
  const superAdmins = users.filter((u) => u.type === "SUPERADMIN");
  const admins = users.filter((u) => u.type === "ADMIN");
  const regularUsers = users.filter((u) => u.type === "USER");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-text">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-accent">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            Root Dashboard
          </h1>
          <div className="text-sm text-text-secondary">
            Overview of all system users
          </div>
        </div>

        {/* Root Admin */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Root Administrators ({rootAdmins.length})
            </h2>
          </div>
          {rootAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {rootAdmins.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No Root Admins found
            </div>
          )}
        </div>

        {/* Super Admins */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Super Administrators ({superAdmins.length})
            </h2>
          </div>
          {superAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {superAdmins.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No Super Admins found
            </div>
          )}
        </div>

        {/* Admins */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Administrators ({admins.length})
            </h2>
          </div>
          {admins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {admins.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No Admins found
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Users ({regularUsers.length})
            </h2>
          </div>
          {regularUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {regularUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {user.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No Users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RootDashboard;
