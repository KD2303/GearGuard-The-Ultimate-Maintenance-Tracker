import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import { Link } from "react-router-dom";

import { globalSearch } from "../services/searchService";

import { GlobalSearchResults } from "../types";

import SearchDropdown from "../components/SearchDropdown";

import { requestService } from "../services/requestService";

import { equipmentService } from "../services/equipmentService";

import { teamService } from "../services/teamService";

import {
  Wrench,
  Box,
  Users,
  AlertCircle,
  Clock,
  Search,
} from "lucide-react";

import Badge from "../components/Badge";

import TeamActivity from "../components/TeamActivity";

import QuickActionCards from "../components/QuickActionCards";

import Spinner from "../components/Spinner";

const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<GlobalSearchResults>({
      equipment: [],
      requests: [],
    });

  const [isSearching, setIsSearching] =
    useState(false);

  const [showDropdown, setShowDropdown] =
    useState(false);

  const searchRef =
    useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalRequests: 0,
    newRequests: 0,
    inProgressRequests: 0,
    totalEquipment: 0,
    underMaintenance: 0,
    totalTeams: 0,
  });

  const [recentRequests, setRecentRequests] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [requests, equipment, teams] =
          await Promise.all([
            requestService.getAll(),
            equipmentService.getAll(),
            teamService.getAllTeams(),
          ]);

        setStats({
          totalRequests: requests.length,

          newRequests: requests.filter(
            (r) => r.stage === "new"
          ).length,

          inProgressRequests:
            requests.filter(
              (r) =>
                r.stage === "in-progress"
            ).length,

          totalEquipment: equipment.length,

          underMaintenance:
            equipment.filter(
              (e) =>
                e.status ===
                "under-maintenance"
            ).length,

          totalTeams: teams.length,
        });

        setRecentRequests(
          requests.slice(0, 5)
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults({
        equipment: [],
        requests: [],
      });

      setShowDropdown(false);

      return;
    }

    const timer = setTimeout(
      async () => {
        setIsSearching(true);

        setShowDropdown(true);

        try {
          const results =
            await globalSearch(
              searchQuery
            );

          setSearchResults(results);
        } catch (error) {
          console.error(
            "Search failed:",
            error
          );
        } finally {
          setIsSearching(false);
        }
      },
      300
    );

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (
      e: MouseEvent
    ) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          e.target as Node
        )
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        setShowDropdown(false);

        setSearchQuery("");
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);

  const statCards = [
    {
      title: "Total Requests",
      value: stats.totalRequests,
      icon: Wrench,
      gradient:
        "from-blue-500 to-cyan-600",
      link: "/requests",
      trend: "+12%",
    },

    {
      title: "New Requests",
      value: stats.newRequests,
      icon: AlertCircle,
      gradient:
        "from-yellow-500 to-orange-600",
      link: "/requests",
      trend: "+5%",
    },

    {
      title: "In Progress",
      value: stats.inProgressRequests,
      icon: Clock,
      gradient:
        "from-purple-500 to-pink-600",
      link: "/requests",
      trend: "+8%",
    },

    {
      title: "Total Equipment",
      value: stats.totalEquipment,
      icon: Box,
      gradient:
        "from-green-500 to-teal-600",
      link: "/equipment",
      trend: "+3%",
    },

    {
      title: "Under Maintenance",
      value: stats.underMaintenance,
      icon: Wrench,
      gradient:
        "from-red-500 to-pink-600",
      link: "/equipment",
      trend: "-2%",
    },

    {
      title: "Maintenance Teams",
      value: stats.totalTeams,
      icon: Users,
      gradient:
        "from-indigo-500 to-purple-600",
      link: "/teams",
      trend: "0%",
    },
  ];

  if (loading) {
    return (
      <Spinner
        size="lg"
        label="Loading dashboard..."
        centered
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search */}
      <div className="rounded-3xl border border-white/50 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-4 shadow-lg backdrop-blur-sm md:p-5">
        <div
          ref={searchRef}
          className="relative w-full"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 md:h-5 md:w-5" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            onFocus={() => {
              if (
                searchQuery.trim() !== ""
              ) {
                setShowDropdown(true);
              }
            }}
            placeholder="Search equipment, requests..."
            className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 px-10 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm outline-none transition-all duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");

                setSearchResults({
                  equipment: [],
                  requests: [],
                });

                setShowDropdown(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          )}

          {showDropdown && (
            <SearchDropdown
              results={searchResults}
              query={searchQuery}
              isLoading={isSearching}
              onClose={() => {
                setShowDropdown(false);

                setSearchQuery("");
              }}
            />
          )}
        </div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome Back! 👋
          </h2>

          <p className="text-blue-100 text-lg max-w-2xl">
            GearGuard: The Ultimate
            Maintenance Tracker
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionCards />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map(
          (stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>

                <span className="text-sm font-semibold text-green-600">
                  {stat.trend}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>

                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </Link>
          )
        )}
      </div>

      {/* Activity + Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Recent Activity
            </h3>

            <Link
              to="/activity"
              className="text-sm text-white"
            >
              View All →
            </Link>
          </div>

          <TeamActivity />
        </div>

        {/* Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Recent Requests
            </h3>

            <Link
              to="/requests-all"
              className="text-sm text-white"
            >
              View All →
            </Link>
          </div>

          <div className="p-6">
            {recentRequests.length >
            0 ? (
              <div className="space-y-3">
                {recentRequests.map(
                  (
                    request,
                    idx
                  ) => (
                    <div
                      key={request.id}
                      className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {
                                request.subject
                              }
                            </h4>

                            <Badge
                              variant="info"
                              size="sm"
                            >
                              {
                                request.stage
                              }
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {
                              request.requestNumber
                            }
                          </p>
                        </div>

                        {request.assignedTo && (
                          <div className="text-right">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {
                                request
                                  .assignedTo
                                  .name
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />

                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No recent requests
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create a new
                  maintenance request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;