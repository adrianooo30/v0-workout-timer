"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Play, Pause, RotateCcw, Settings, Plus, Trash2, Edit } from "lucide-react"

interface WorkoutPreset {
  id: string
  name: string
  workoutTime: number
  restTime: number
  totalReps: number
  autoContinue: boolean
}

export default function WorkoutTimer() {
  // Workout presets state
  const [workoutPresets, setWorkoutPresets] = useState<WorkoutPreset[]>([
    {
      id: "1",
      name: "Quick HIIT",
      workoutTime: 30,
      restTime: 10,
      totalReps: 8,
      autoContinue: true,
    },
    {
      id: "2",
      name: "Strength Training",
      workoutTime: 45,
      restTime: 60,
      totalReps: 5,
      autoContinue: false,
    },
  ])

  const [selectedPresetId, setSelectedPresetId] = useState<string>("1")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<WorkoutPreset | null>(null)

  // Form state for adding/editing workouts
  const [formData, setFormData] = useState({
    name: "",
    workoutTime: 30,
    restTime: 10,
    totalReps: 5,
    autoContinue: true,
  })

  // Get current selected preset
  const currentPreset = workoutPresets.find((p) => p.id === selectedPresetId) || workoutPresets[0]

  // Timer state
  const [currentRep, setCurrentRep] = useState(1)
  const [timeLeft, setTimeLeft] = useState(currentPreset?.workoutTime || 30)
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<"workout" | "rest" | "complete">("workout")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    const createBeepSound = () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a longer, more noticeable tone sequence
      const playBeepSequence = () => {
        // First beep - higher pitch
        const oscillator1 = audioContext.createOscillator()
        const gainNode1 = audioContext.createGain()

        oscillator1.connect(gainNode1)
        gainNode1.connect(audioContext.destination)

        oscillator1.frequency.value = 1000
        oscillator1.type = "sine"

        gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime)
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

        oscillator1.start(audioContext.currentTime)
        oscillator1.stop(audioContext.currentTime + 0.8)

        // Second beep - lower pitch (after short pause)
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        oscillator2.frequency.value = 800
        oscillator2.type = "sine"

        gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime + 1.0)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8)

        oscillator2.start(audioContext.currentTime + 1.0)
        oscillator2.stop(audioContext.currentTime + 1.8)

        // Third beep - highest pitch (final alert)
        const oscillator3 = audioContext.createOscillator()
        const gainNode3 = audioContext.createGain()

        oscillator3.connect(gainNode3)
        gainNode3.connect(audioContext.destination)

        oscillator3.frequency.value = 1200
        oscillator3.type = "sine"

        gainNode3.gain.setValueAtTime(0.5, audioContext.currentTime + 2.0)
        gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3.5)

        oscillator3.start(audioContext.currentTime + 2.0)
        oscillator3.stop(audioContext.currentTime + 3.5)
      }

      playBeepSequence()
    }

    audioRef.current = { play: createBeepSound } as any
  }, [])

  // Reset timer when preset changes
  useEffect(() => {
    if (currentPreset) {
      setTimeLeft(currentPreset.workoutTime)
      setCurrentRep(1)
      setPhase("workout")
      setIsRunning(false)
    }
  }, [selectedPresetId, currentPreset])

  // Timer logic
  useEffect(() => {
    if (!currentPreset) return

    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      // Timer finished
      audioRef.current?.play()

      if (phase === "workout") {
        if (currentPreset.autoContinue) {
          // Auto switch to rest
          setPhase("rest")
          setTimeLeft(currentPreset.restTime)
        } else {
          setIsRunning(false)
        }
      } else if (phase === "rest") {
        // Move to next rep or complete
        if (currentRep < currentPreset.totalReps) {
          setCurrentRep((prev) => prev + 1)
          setPhase("workout")
          setTimeLeft(currentPreset.workoutTime)
          if (!currentPreset.autoContinue) {
            setIsRunning(false)
          }
        } else {
          // Workout complete
          setPhase("complete")
          setIsRunning(false)
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, phase, currentPreset, currentRep])

  const handleStartPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentRep(1)
    setPhase("workout")
    setTimeLeft(currentPreset?.workoutTime || 30)
  }

  const handleAddWorkout = () => {
    const newPreset: WorkoutPreset = {
      id: Date.now().toString(),
      ...formData,
    }
    setWorkoutPresets([...workoutPresets, newPreset])
    setFormData({ name: "", workoutTime: 30, restTime: 10, totalReps: 5, autoContinue: true })
    setIsAddDialogOpen(false)
  }

  const handleEditWorkout = (preset: WorkoutPreset) => {
    setEditingPreset(preset)
    setFormData({
      name: preset.name,
      workoutTime: preset.workoutTime,
      restTime: preset.restTime,
      totalReps: preset.totalReps,
      autoContinue: preset.autoContinue,
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateWorkout = () => {
    if (editingPreset) {
      setWorkoutPresets(workoutPresets.map((p) => (p.id === editingPreset.id ? { ...editingPreset, ...formData } : p)))
      setEditingPreset(null)
      setFormData({ name: "", workoutTime: 30, restTime: 10, totalReps: 5, autoContinue: true })
      setIsAddDialogOpen(false)
    }
  }

  const handleDeleteWorkout = (id: string) => {
    if (workoutPresets.length > 1) {
      setWorkoutPresets(workoutPresets.filter((p) => p.id !== id))
      if (selectedPresetId === id) {
        setSelectedPresetId(workoutPresets.find((p) => p.id !== id)?.id || "")
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getPhaseColor = () => {
    switch (phase) {
      case "workout":
        return "text-green-600"
      case "rest":
        return "text-blue-600"
      case "complete":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  const getPhaseText = () => {
    switch (phase) {
      case "workout":
        return "WORKOUT"
      case "rest":
        return "REST"
      case "complete":
        return "COMPLETE!"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel - Left Side */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Workout Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workout Selection */}
            <div className="space-y-2">
              <Label>Select Workout</Label>
              <div className="flex gap-2">
                <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a workout" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutPresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingPreset(null)
                        setFormData({ name: "", workoutTime: 30, restTime: 10, totalReps: 5, autoContinue: true })
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPreset ? "Edit Workout" : "Add New Workout"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="form-name">Workout Name</Label>
                        <Input
                          id="form-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter workout name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="form-workout-time">Workout Time (seconds)</Label>
                          <Input
                            id="form-workout-time"
                            type="number"
                            min="1"
                            value={formData.workoutTime}
                            onChange={(e) => setFormData({ ...formData, workoutTime: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="form-rest-time">Rest Time (seconds)</Label>
                          <Input
                            id="form-rest-time"
                            type="number"
                            min="1"
                            value={formData.restTime}
                            onChange={(e) => setFormData({ ...formData, restTime: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="form-reps">Number of Reps</Label>
                        <Input
                          id="form-reps"
                          type="number"
                          min="1"
                          value={formData.totalReps}
                          onChange={(e) => setFormData({ ...formData, totalReps: Number(e.target.value) })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="form-auto-continue" className="text-sm font-medium">
                          Auto Continue to Rest Timer
                        </Label>
                        <Switch
                          id="form-auto-continue"
                          checked={formData.autoContinue}
                          onCheckedChange={(checked) => setFormData({ ...formData, autoContinue: checked })}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={editingPreset ? handleUpdateWorkout : handleAddWorkout}
                          disabled={!formData.name.trim()}
                          className="flex-1"
                        >
                          {editingPreset ? "Update Workout" : "Add Workout"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Current Workout Details */}
            {currentPreset && (
              <>
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{currentPreset.name}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditWorkout(currentPreset)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {workoutPresets.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteWorkout(currentPreset.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Workout:</span> {formatTime(currentPreset.workoutTime)}
                    </div>
                    <div>
                      <span className="text-gray-600">Rest:</span> {formatTime(currentPreset.restTime)}
                    </div>
                    <div>
                      <span className="text-gray-600">Reps:</span> {currentPreset.totalReps}
                    </div>
                    <div>
                      <span className="text-gray-600">Auto Continue:</span> {currentPreset.autoContinue ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Workout Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Total workout time: {formatTime(currentPreset.workoutTime * currentPreset.totalReps)}</p>
                    <p>Total rest time: {formatTime(currentPreset.restTime * (currentPreset.totalReps - 1))}</p>
                    <p>
                      Total duration:{" "}
                      {formatTime(
                        currentPreset.workoutTime * currentPreset.totalReps +
                          currentPreset.restTime * (currentPreset.totalReps - 1),
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timer Display - Right Side */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-center">{currentPreset?.name || "Select a Workout"}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {currentPreset ? (
              <>
                <div className="space-y-2">
                  <div className={`text-lg font-semibold ${getPhaseColor()}`}>{getPhaseText()}</div>
                  <div className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-lg">
                    Rep {currentRep} of {currentPreset.totalReps}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentRep / currentPreset.totalReps) * 100}%` }}
                    />
                  </div>
                </div>

                {phase !== "complete" && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">{phase === "workout" ? "Next: Rest" : "Next: Workout"}</div>
                    <div className="text-sm text-gray-600">
                      {phase === "workout" ? formatTime(currentPreset.restTime) : formatTime(currentPreset.workoutTime)}
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-4 pt-4">
                  <Button onClick={handleStartPause} size="lg" className="w-20" disabled={phase === "complete"}>
                    {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button onClick={handleReset} size="lg" variant="outline" className="w-20">
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>

                {phase === "complete" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-semibold">🎉 Workout Complete!</div>
                    <div className="text-green-600 text-sm mt-1">
                      Great job finishing all {currentPreset.totalReps} reps!
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 py-8">Please select a workout to begin</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
