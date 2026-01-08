'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Pencil, RefreshCw, Upload, Video, Trash2, GripVertical, MessageCircle, Maximize2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Scene, Scenario } from '../../types'
import { EditSceneModal } from './edit-scene-modal'
import { ConversationalEditModal } from './conversational-edit-modal'
import { VideoPlayer } from "../video/video-player"
import { GcsImage } from "../ui/gcs-image"
import { cn } from "@/lib/utils"

interface SceneDataProps {
  scene: Scene;
  sceneNumber: number;
  scenario: Scenario;
  onUpdate: (updatedScene: SceneDataProps['scene']) => void;
  onRegenerateImage: (imageType?: 'start' | 'end') => void | Promise<void>;
  onGenerateVideo: () => void | Promise<void>;
  onUploadImage: (file: File, imageType?: 'start' | 'end') => void | Promise<void>;
  onRemoveScene: () => void;
  isGenerating: boolean;
  canDelete: boolean;
  displayMode?: 'image' | 'video';
  hideControls?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function SceneData({
  scene,
  sceneNumber,
  scenario,
  onUpdate,
  onRegenerateImage,
  onGenerateVideo,
  onUploadImage,
  onRemoveScene,
  isGenerating,
  canDelete,
  displayMode = 'image',
  hideControls = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: SceneDataProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConversationalEditOpen, setIsConversationalEditOpen] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<'start' | 'end' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (imageType: 'start' | 'end' = 'start') => {
    if (imageType === 'start') {
      fileInputRef.current?.click()
    } else {
      endFileInputRef.current?.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, imageType: 'start' | 'end' = 'start') => {
    const file = event.target.files?.[0]
    if (file) {
      onUploadImage(file, imageType)
    }
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        isDragOver && "ring-2 ring-blue-500 bg-blue-50",
        "hover:shadow-lg"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col">
        <div className="flex flex-row gap-1">
          {/* Start Frame */}
          <div className={cn(
            "relative w-full aspect-[11/6] overflow-hidden group flex-1 transition-all duration-300",
            zoomedImage === 'start' ? "fixed inset-0 z-[100] bg-black/90 aspect-none" : "relative"
          )}>
            {isGenerating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {displayMode === 'video' && scene.videoUri ? (
              <div className="absolute inset-0">
                <VideoPlayer videoGcsUri={scene.videoUri} aspectRatio={scenario.aspectRatio} />
              </div>
            ) : (
              <div 
                className={cn(
                  "absolute inset-0 cursor-zoom-in group/image",
                  zoomedImage === 'start' && "cursor-zoom-out"
                )}
                onClick={() => setZoomedImage(zoomedImage === 'start' ? null : 'start')}
              >
                <GcsImage
                  gcsUri={scene.imageGcsUri || null}
                  alt={`Scene ${sceneNumber} Start`}
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain object-center rounded-tl-lg transition-all duration-300",
                    zoomedImage === 'start' && "p-4 md:p-12 rounded-none"
                  )}
                  sizes={zoomedImage === 'start' ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                />
                {zoomedImage !== 'start' && (
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity h-8 w-8" />
                  </div>
                )}
              </div>
            )}
            {zoomedImage === 'start' && (
              <button 
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[101]"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImage(null);
                }}
              >
                <X className="h-8 w-8" />
              </button>
            )}
            {!hideControls && (
              <>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-blue-500 hover:text-white"
                    onClick={() => onGenerateVideo()}
                    disabled={isGenerating}
                    title={scene.videoUri ? "Regenerate video" : "Generate video"}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : (scene.videoUri ? <RefreshCw className="h-4 w-4" /> : <Video className="h-4 w-4" />)}
                    <span className="sr-only">{scene.videoUri ? "Regenerate" : "Generate"} video</span>
                  </Button>
                </div>
                <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-red-500 hover:text-white"
                    onClick={() => onRegenerateImage('start')}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Regenerate image</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-green-500 hover:text-white"
                    onClick={() => handleUploadClick('start')}
                    disabled={isGenerating}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Upload image</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-purple-500 hover:text-white"
                    onClick={() => setIsConversationalEditOpen(true)}
                    disabled={isGenerating}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="sr-only">Conversational edit</span>
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'start')} accept="image/*" className="hidden" />
                </div>
                {canDelete && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-black/50 hover:bg-red-500 hover:text-white"
                      onClick={onRemoveScene}
                      disabled={isGenerating}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete scene</span>
                    </Button>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="bg-black/50 hover:bg-blue-500 hover:text-white p-1.5 rounded cursor-grab active:cursor-grabbing transition-colors select-none"
                    style={{ touchAction: 'none' }}
                    title="Drag to reorder scene"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* End Frame (Only visible in image mode) */}
          {displayMode === 'image' && (
            <div className={cn(
              "relative w-full aspect-[11/6] overflow-hidden group flex-1 border-l border-white/20 transition-all duration-300",
              zoomedImage === 'end' ? "fixed inset-0 z-[100] bg-black/90 aspect-none" : "relative"
            )}>
              {isGenerating && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              {scene.endImageGcsUri ? (
                <div 
                  className={cn(
                    "absolute inset-0 cursor-zoom-in group/image",
                    zoomedImage === 'end' && "cursor-zoom-out"
                  )}
                  onClick={() => setZoomedImage(zoomedImage === 'end' ? null : 'end')}
                >
                  <GcsImage
                    gcsUri={scene.endImageGcsUri}
                    alt={`Scene ${sceneNumber} End`}
                    className={cn(
                      "absolute inset-0 w-full h-full object-contain object-center rounded-tr-lg transition-all duration-300",
                      zoomedImage === 'end' && "p-4 md:p-12 rounded-none"
                    )}
                    sizes={zoomedImage === 'end' ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                  />
                  {zoomedImage !== 'end' && (
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity h-8 w-8" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 opacity-20" />
                    <span className="text-xs font-medium opacity-40">No End Frame</span>
                  </div>
                </div>
              )}
              
              {zoomedImage === 'end' && (
                <button 
                  className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[101]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImage(null);
                  }}
                >
                  <X className="h-8 w-8" />
                </button>
              )}
              
              {!hideControls && (
                <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-red-500 hover:text-white"
                    onClick={() => onRegenerateImage('end')}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Regenerate end frame</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-green-500 hover:text-white"
                    onClick={() => handleUploadClick('end')}
                    disabled={isGenerating}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Upload end frame</span>
                  </Button>
                  <input type="file" ref={endFileInputRef} onChange={(e) => handleFileChange(e, 'end')} accept="image/*" className="hidden" />
                </div>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-primary">Scene {sceneNumber}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-secondary hover:text-primary hover:bg-primary/10"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          {scene.errorMessage && (
              <p className="text-sm text-red-600">{scene.errorMessage}</p>
          )}
          <p className="text-sm text-muted-foreground">{scene.description}</p>
        </CardContent>
      </div>
      <EditSceneModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        scene={scene}
        sceneNumber={sceneNumber}
        scenario={scenario}
        onUpdate={onUpdate}
        displayMode={displayMode}
      />
      <ConversationalEditModal
        isOpen={isConversationalEditOpen}
        onClose={() => setIsConversationalEditOpen(false)}
        scene={scene}
        sceneNumber={sceneNumber}
        scenario={scenario}
        onUpdate={onUpdate}
      />


    </Card>
  )
}
