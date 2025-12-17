import { useState, useCallback, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreeView } from './components/TreeView'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { PlatformConnectionDialog } from './components/dialogs/PlatformConnectionDialog'
import { CreateCustomerDialog } from './components/dialogs/CreateCustomerDialog'
import './App.css'

const queryClient = new QueryClient()

export interface SelectedNode {
  id: string
  type: string
  name: string
  data: unknown
  connectionId?: number
  platformType?: string
}

function App() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [treePanelWidth, setTreePanelWidth] = useState(300)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false)
  const [createCustomerConnectionId, setCreateCustomerConnectionId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef<string | null>(null)

  const handleMouseDown = useCallback((resizer: string) => {
    isDragging.current = resizer
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    if (isDragging.current === 'left') {
      const newWidth = Math.max(200, Math.min(600, e.clientX - rect.left))
      setTreePanelWidth(newWidth)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const handleCreateCustomer = useCallback((connectionId: number) => {
    setCreateCustomerConnectionId(connectionId)
    setShowCreateCustomerDialog(true)
  }, [])

  const handleRefreshTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tree'] })
    queryClient.invalidateQueries({ queryKey: ['connections'] })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="app"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Toolbar
          selectedNode={selectedNode}
          onAddConnection={() => setShowConnectionDialog(true)}
          onRefresh={handleRefreshTree}
        />
        <div className="main-layout">
          {/* Left: Tree Panel */}
          <div className="panel tree-panel" style={{ width: treePanelWidth }}>
            <div className="panel-header">Payment Platforms</div>
            <div className="panel-content">
              <TreeView
                onSelectNode={setSelectedNode}
                onCreateCustomer={handleCreateCustomer}
              />
            </div>
          </div>

          {/* Resizer */}
          <div
            className="resizer resizer-vertical"
            onMouseDown={() => handleMouseDown('left')}
          />

          {/* Right: Properties Panel */}
          <div className="panel properties-panel">
            <div className="panel-header">
              {selectedNode ? `${selectedNode.name}` : 'Select an item'}
            </div>
            <div className="panel-content">
              <PropertiesPanel selectedNode={selectedNode} />
            </div>
          </div>
        </div>

        {/* Connection Dialog */}
        {showConnectionDialog && (
          <PlatformConnectionDialog
            onClose={() => setShowConnectionDialog(false)}
            onSuccess={() => {
              setShowConnectionDialog(false)
              handleRefreshTree()
            }}
          />
        )}

        {/* Create Customer Dialog */}
        {showCreateCustomerDialog && createCustomerConnectionId && (
          <CreateCustomerDialog
            connectionId={createCustomerConnectionId}
            onClose={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
            }}
            onSuccess={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
              queryClient.invalidateQueries({ queryKey: ['maxio', 'customers'] })
            }}
          />
        )}
      </div>
    </QueryClientProvider>
  )
}

export default App
