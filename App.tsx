
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Task, TaskStatus, ModalState, ModalData, ModalType, AdminUser, FileData, ExportDataFormat } from './types';
import { sortTasksChronologically } from './utils';
import ProjectCard from './components/ProjectCard';
import Modal from './components/Modal';
import ConfirmationModal from './components/ConfirmationModal';
import TaskItem from './components/TaskItem';
import ProjectCanvasView from './components/ProjectCanvasView';
import ProjectTimelineView from './components/ProjectTimelineView';
import { PlusIcon, TasksIcon, CanvasViewIcon, LoginIcon, LogoutIcon, TimelineIcon, ChevronDownIcon, PlayIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ChipIcon, ArrowPathIcon } from './constants';
import { storage } from './portable-storage';


// --- Admin Users (DEMO ONLY - NOT SECURE) ---
const ADMIN_USERS: AdminUser[] = [
  { username: 'admin', passwordHash: 'password123' },
  { username: 'editor', passwordHash: 'editpass' },
];
// --- End Admin Users ---


// Recursive helper to add a task (or subtask)
const addTaskRecursive = (tasks: Task[], newTask: Task, parentId?: string | null): Task[] => {
  if (!parentId) {
    return sortTasksChronologically([newTask, ...tasks]);
  }
  return tasks.map(task => {
    if (task.id === parentId) {
      return { ...task, subTasks: sortTasksChronologically([newTask, ...(task.subTasks || [])]) };
    }
    if (task.subTasks && task.subTasks.length > 0) {
      return { ...task, subTasks: addTaskRecursive(task.subTasks, newTask, parentId) };
    }
    return task;
  });
};

// Recursive helper to update a task (or subtask)
const updateTaskRecursive = (tasks: Task[], updatedTask: Task): Task[] => {
  return tasks.map(task => {
    if (task.id === updatedTask.id) {
      // Preserve level and ensure subTasks/files are not accidentally overwritten if not in updatedTask
      return {
        ...task,
        ...updatedTask,
        subTasks: updatedTask.subTasks || task.subTasks,
        files: updatedTask.files || task.files,
        level: task.level !== undefined ? task.level : (updatedTask.level !== undefined ? updatedTask.level : 0) // Ensure level is preserved
      };
    }
    if (task.subTasks && task.subTasks.length > 0) {
      const newSubTasks = updateTaskRecursive(task.subTasks, updatedTask);
      return { ...task, subTasks: sortTasksChronologically(newSubTasks) };
    }
    return task;
  });
};

// Recursive helper to delete a task (or subtask)
const deleteTaskRecursive = (tasks: Task[], taskIdToDelete: string): Task[] => {
  const filteredTasks = tasks.filter(task => task.id !== taskIdToDelete);
  return filteredTasks.map(task => {
    if (task.subTasks && task.subTasks.length > 0) {
      const updatedSubTasks = deleteTaskRecursive(task.subTasks, taskIdToDelete);
      return { ...task, subTasks: updatedSubTasks || [] };
    }
    return task;
  });
};

// Recursive helper to add a file to a task
const addFileToTaskRecursive = (tasks: Task[], taskId: string, fileData: FileData): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      const updatedFiles = [...(task.files || []), fileData];
      return { ...task, files: updatedFiles.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) };
    }
    if (task.subTasks && task.subTasks.length > 0) {
      return { ...task, subTasks: addFileToTaskRecursive(task.subTasks, taskId, fileData) };
    }
    return task;
  });
};

// Recursive helper to delete a file from a task
const deleteFileFromTaskRecursive = (tasks: Task[], taskId: string, fileIdToDelete: string): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      const updatedFiles = (task.files || []).filter(file => file.id !== fileIdToDelete);
      return { ...task, files: updatedFiles };
    }
    if (task.subTasks && task.subTasks.length > 0) {
      return { ...task, subTasks: deleteFileFromTaskRecursive(task.subTasks, taskId, fileIdToDelete) };
    }
    return task;
  });
};


const getRelativeDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Debounce utility function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
};

const getFormattedDateTimeForFilename = (): string => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MIN = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD}_${HH}-${MIN}-${SS}`;
};

const validateAndSanitizeProjects = (projectsToValidate: any[]): Project[] => {
    if (!Array.isArray(projectsToValidate)) {
        console.error("Import validation failed: projects data is not an array.");
        throw new Error("Invalid import format: projects data must be an array.");
    }
    return projectsToValidate.map((p: any): Project => {
        if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.createdAt !== 'string') {
            console.error("Import validation failed: project structure is invalid.", p);
            throw new Error("Invalid project structure in import file.");
        }
        const validateAndSortTask = (t: any): Task => {
            if (!t || typeof t.id !== 'string' || typeof t.name !== 'string' || !t.status) {
                console.error("Import validation failed: task structure is invalid.", t);
                throw new Error("Invalid task structure in import file.");
            }
            return {
                ...t,
                id: t.id || crypto.randomUUID(),
                name: t.name,
                description: t.description || undefined,
                status: Object.values(TaskStatus).includes(t.status) ? t.status : TaskStatus.ToDo,
                startDate: t.startDate || undefined,
                dueDate: t.dueDate || undefined,
                department: t.department || undefined,
                assignedTo: t.assignedTo || undefined,
                parentId: t.parentId !== undefined ? t.parentId : null,
                level: typeof t.level === 'number' ? t.level : 0,
                files: (Array.isArray(t.files) ? t.files : []).map((f: any) => {
                     if (!f || typeof f.id !== 'string' || typeof f.name !== 'string' || typeof f.dataUrl !== 'string') {
                         console.warn("Import validation: file structure is invalid, creating new ID.", f);
                         return {...f, id: crypto.randomUUID(), name: f.name || 'unknown_file', dataUrl: f.dataUrl || '', type: f.type || 'application/octet-stream', size: f.size || 0, uploadedAt: f.uploadedAt || new Date().toISOString()};
                     }
                     return {
                        id: f.id || crypto.randomUUID(),
                        name: f.name,
                        type: f.type || 'application/octet-stream',
                        size: typeof f.size === 'number' ? f.size : 0,
                        dataUrl: f.dataUrl,
                        uploadedAt: f.uploadedAt || new Date().toISOString(),
                     };
                }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
                subTasks: sortTasksChronologically((Array.isArray(t.subTasks) ? t.subTasks : []).map(validateAndSortTask))
            };
        };
        return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            createdAt: p.createdAt,
            tasks: sortTasksChronologically((Array.isArray(p.tasks) ? p.tasks : []).map(validateAndSortTask))
        };
    });
};

const createMockOsatProject = (): Project => {
  const projectId = crypto.randomUUID();
  
  const createTask = (name: string, level: number, parentId: string | null, status: TaskStatus, daysOffsetStart: number, daysOffsetDue: number, department?: string, assignedTo?: string, description?: string, subTasks?: Task[]): Task => ({
    id: crypto.randomUUID(),
    name,
    description,
    status,
    startDate: getRelativeDate(daysOffsetStart),
    dueDate: getRelativeDate(daysOffsetDue),
    department,
    assignedTo,
    parentId,
    level,
    subTasks: subTasks ? sortTasksChronologically(subTasks) : [],
    files: [],
  });

  const npiPhaseId = crypto.randomUUID();
  const waferPhaseId = crypto.randomUUID();
  const assemblyPhaseId = crypto.randomUUID();
  const testPhaseId = crypto.randomUUID();
  const qaPhaseId = crypto.randomUUID();
  
  const materialProcurementId = crypto.randomUUID();

  return {
    id: projectId,
    name: "TE OSAT",
    description: "Full lifecycle management for the assembly, test, and packaging of the NextGen System-on-Chip. This project covers all stages from NPI to final shipment.",
    createdAt: new Date().toISOString(),
    tasks: sortTasksChronologically([
      { // NPI & Setup
        id: npiPhaseId,
        name: "NPI & Setup",
        description: "New Product Introduction phase including scope definition, resource allocation, and system setup.",
        status: TaskStatus.InProgress,
        startDate: getRelativeDate(0),
        dueDate: getRelativeDate(7),
        department: "NPI Engineering",
        assignedTo: "Alice Wonderland",
        parentId: null,
        level: 0,
        subTasks: sortTasksChronologically([
          createTask("Define Scope & Specifications", 1, npiPhaseId, TaskStatus.Done, 0, 2, "NPI Eng.", "Alice W.", "Finalize product requirements and technical specifications."),
          createTask("Resource Allocation", 1, npiPhaseId, TaskStatus.InProgress, 1, 4, "Management", "Cheshire Cat", "Assign personnel, equipment, and budget."),
          createTask("System Configuration & Calibration", 1, npiPhaseId, TaskStatus.ToDo, 3, 7, "IT/Ops", "Mad Hatter", "Set up and calibrate all necessary manufacturing and test systems."),
        ]),
        files: [],
      },
      { // Wafer Bumping & Probe
        id: waferPhaseId,
        name: "Wafer Bumping & Probe",
        description: "Processing wafers, including bumping and initial electrical probe testing.",
        status: TaskStatus.ToDo,
        startDate: getRelativeDate(5),
        dueDate: getRelativeDate(15),
        department: "Fab Operations",
        assignedTo: "Bob The Builder",
        parentId: null,
        level: 0,
        subTasks: sortTasksChronologically([
          {
            id: materialProcurementId,
            name: "Material Procurement (Wafers & Consumables)",
            description: "Order and receive silicon wafers and other necessary consumables.",
            status: TaskStatus.InProgress,
            startDate: getRelativeDate(5),
            dueDate: getRelativeDate(10),
            department: "Procurement",
            assignedTo: "Wendy",
            parentId: waferPhaseId,
            level: 1,
            subTasks: sortTasksChronologically([
              createTask("Vendor Qualification & Selection", 2, materialProcurementId, TaskStatus.Done, 5, 6, "Procurement", "Wendy", "Select and qualify wafer suppliers."),
              createTask("Issue Purchase Orders", 2, materialProcurementId, TaskStatus.InProgress, 6, 7, "Procurement", "Wendy", "Place orders for wafers."),
              createTask("Incoming Material Inspection", 2, materialProcurementId, TaskStatus.ToDo, 9, 10, "QA", "Spud", "Inspect received materials for quality."),
            ]),
            files: [],
          },
          createTask("Wafer Bumping Process", 1, waferPhaseId, TaskStatus.ToDo, 10, 13, "Fab Ops", "Bob T.B.", "Apply solder bumps to wafer bond pads."),
          createTask("Wafer Sort & Electrical Probe", 1, waferPhaseId, TaskStatus.ToDo, 13, 15, "Test Eng.", "Scoop", "Perform initial electrical tests on individual dies."),
        ]),
        files: [],
      },
      { // Assembly & Packaging
        id: assemblyPhaseId,
        name: "Assembly & Packaging",
        description: "Die attach, wire bonding, encapsulation, and final package assembly.",
        status: TaskStatus.ToDo,
        startDate: getRelativeDate(16),
        dueDate: getRelativeDate(28),
        department: "Assembly Line",
        assignedTo: "Charlie Chaplin",
        parentId: null,
        level: 0,
        subTasks: sortTasksChronologically([
          createTask("Die Preparation & Attach", 1, assemblyPhaseId, TaskStatus.ToDo, 16, 19, "Assembly", "Charlie C.", "Prepare dies and attach them to substrates."),
          createTask("Wire Bonding / Flip Chip", 1, assemblyPhaseId, TaskStatus.ToDo, 19, 22, "Assembly", "Paulette G.", "Connect die pads to package leads."),
          createTask("Molding & Encapsulation", 1, assemblyPhaseId, TaskStatus.ToDo, 22, 25, "Assembly", "Charlie C.", "Encapsulate the assembled die."),
          createTask("Marking & Singulation", 1, assemblyPhaseId, TaskStatus.ToDo, 25, 28, "Assembly", "Paulette G.", "Mark packages and separate them into individual units."),
        ]),
        files: [],
      },
      { // Final Test & Burn-in
        id: testPhaseId,
        name: "Final Test & Burn-in",
        description: "Comprehensive final testing and reliability stress (burn-in).",
        status: TaskStatus.ToDo,
        startDate: getRelativeDate(29),
        dueDate: getRelativeDate(38),
        department: "Test Engineering",
        assignedTo: "Dorothy Gale",
        parentId: null,
        level: 0,
        subTasks: sortTasksChronologically([
          createTask("Automated Test Equipment (ATE) Setup", 1, testPhaseId, TaskStatus.ToDo, 29, 30, "Test Eng.", "Scarecrow", "Configure ATE for final test programs."),
          createTask("Final Electrical Test", 1, testPhaseId, TaskStatus.ToDo, 30, 34, "Test Ops", "Tin Man", "Perform full functional and parametric tests."),
          createTask("Burn-in Process", 1, testPhaseId, TaskStatus.ToDo, 34, 37, "Reliability Lab", "Cowardly Lion", "Stress test devices to screen for early failures."),
          createTask("Post Burn-in Test", 1, testPhaseId, TaskStatus.ToDo, 37, 38, "Test Ops", "Toto", "Re-test devices after burn-in."),
        ]),
        files: [],
      },
      { // Quality Assurance & Release
        id: qaPhaseId,
        name: "Quality Assurance & Release",
        description: "Final quality checks, documentation, and preparation for shipment.",
        status: TaskStatus.ToDo,
        startDate: getRelativeDate(39),
        dueDate: getRelativeDate(45),
        department: "Quality Assurance",
        assignedTo: "Glinda Goodwitch",
        parentId: null,
        level: 0,
        subTasks: sortTasksChronologically([
          createTask("Outgoing Quality Inspection (OQA)", 1, qaPhaseId, TaskStatus.ToDo, 39, 41, "QA", "Glinda G.", "Perform final visual and AQL inspections."),
          createTask("Documentation Review & Packaging", 1, qaPhaseId, TaskStatus.ToDo, 41, 43, "Logistics", "Wizard of Oz", "Verify all documents and package for shipment."),
          createTask("Customer Release & Shipment", 1, qaPhaseId, TaskStatus.ToDo, 43, 45, "Shipping", "Flying Monkeys", "Release product to customer and arrange shipment."),
        ]),
        files: [],
      },
    ]),
  };
};


const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: undefined });
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'canvas' | 'timeline'>('list');

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [taskDepartment, setTaskDepartment] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [newAdminError, setNewAdminError] = useState('');

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    document.body.classList.add('bg-sky-100', 'text-slate-800');
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('zenTrackTheme'); 

    const loadData = async () => {
      await storage.initialize(); 
      try {
        const loadedProjects = await storage.loadProjects();
        if (loadedProjects) {
          const validatedProjects = validateAndSanitizeProjects(loadedProjects);
          setProjects(validatedProjects);
        } else {
          setProjects([]); 
        }

        // Load settings including admin status and custom admin user
        const settings = await storage.loadSettings();
        if (settings.customAdminUser) {
          // If a custom admin exists, the app should ideally require login
          // For simplicity, we check logged-in status. If app was reset, this would be false.
           setIsAdminLoggedIn(settings.adminStatus === true);
        } else {
            setIsAdminLoggedIn(settings.adminStatus === true);
        }


      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        setProjects([]); 
        setIsAdminLoggedIn(false);
      } finally {
        setIsInitialLoadComplete(true);
      }
    };
    loadData();

  }, []); 

  const debouncedSaveProjects = useCallback(
    debounce(async (updatedProjects: Project[]) => {
      try {
        await storage.saveProjects(updatedProjects);
        console.log('Projects saved to storage');
      } catch (error) {
        console.error('Failed to save projects to storage:', error);
      }
    }, 1000),
    [] 
  );

  const saveAdminStatus = useCallback(async (status: boolean) => {
    try {
      const currentSettings = await storage.loadSettings();
      await storage.saveSettings({ ...currentSettings, adminStatus: status });
      console.log('Admin login status saved to storage');
    } catch (error) {
      console.error('Failed to save admin login status to storage:', error);
    }
  }, []);


  useEffect(() => {
    if (isInitialLoadComplete) { 
      debouncedSaveProjects(projects);
    }
  }, [projects, debouncedSaveProjects, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) { 
      saveAdminStatus(isAdminLoggedIn);
    }
  }, [isAdminLoggedIn, saveAdminStatus, isInitialLoadComplete]);


  const openModal = (type: ModalType, data?: ModalData) => {
    setProjectName(data?.project?.name || '');
    setProjectDescription(data?.project?.description || '');
    setTaskName(data?.task?.name || '');
    setTaskDescription(data?.task?.description || '');
    setTaskStartDate(data?.task?.startDate || '');
    setTaskDueDate(data?.task?.dueDate || '');
    setTaskStatus(data?.task?.status || TaskStatus.ToDo);
    setTaskDepartment(data?.task?.department || '');
    setTaskAssignedTo(data?.task?.assignedTo || '');
    setLoginError(''); 
    setNewAdminError('');
    
    setModalState({ type, data });
  };

  const closeModal = () => {
    setModalState({ type: null, data: undefined });
    setProjectName('');
    setProjectDescription('');
    setTaskName('');
    setTaskDescription('');
    setTaskStartDate('');
    setTaskDueDate('');
    setTaskStatus(TaskStatus.ToDo);
    setTaskDepartment('');
    setTaskAssignedTo('');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setNewAdminUsername('');
    setNewAdminPassword('');
    setNewAdminConfirmPassword('');
    setNewAdminError('');
  };

  const handleAddProject = () => {
    if (!projectName.trim()) {
      alert('Project name cannot be empty.');
      return;
    }
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      description: projectDescription.trim(),
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [newProject, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    closeModal();
  };

  const handleAddMockOsatProject = () => {
    const mockProject = createMockOsatProject();
    setProjects(prev => [mockProject, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleEditProject = () => {
    if (!modalState.data?.project?.id || !projectName.trim()) {
      alert('Project ID is missing or name is empty.');
      return;
    }
    setProjects(prev =>
      prev.map(p =>
        p.id === modalState.data?.project?.id
          ? { ...p, name: projectName.trim(), description: projectDescription.trim() }
          : p
      )
    );
    closeModal();
  };
  
  const confirmDeleteProject = (projectId: string) => {
    openModal('confirmation', {
        confirmationTitle: "Delete Project",
        confirmationMessage: "Are you sure you want to delete this project and all its tasks? This action cannot be undone.",
        onConfirmAction: () => handleDeleteProject(projectId)
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    closeModal(); 
  };

  const handleAddTask = () => {
    const { projectId, parentTaskId, currentLevel } = modalState.data || {};
    if (!projectId || !taskName.trim()) {
      alert('Project ID is missing or task name is empty.');
      return;
    }
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: taskName.trim(),
      description: taskDescription.trim(),
      status: taskStatus,
      startDate: taskStartDate || undefined,
      dueDate: taskDueDate || undefined,
      department: taskDepartment.trim() || undefined,
      assignedTo: taskAssignedTo.trim() || undefined,
      parentId: parentTaskId || null,
      level: parentTaskId ? (currentLevel !== undefined ? currentLevel + 1 : 1) : 0,
      files: [],
    };

    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, tasks: addTaskRecursive(p.tasks, newTask, parentTaskId) }
          : p
      )
    );
    closeModal();
  };

  const handleEditTask = () => {
    const { projectId, task: currentTask } = modalState.data || {}; 

    if (!projectId || !currentTask?.id || !taskName.trim()) {
      alert('Project ID, Task ID, or Task Name is missing or empty.');
      return;
    }
    const updatedTaskDetails: Partial<Task> = {
      name: taskName.trim(),
      description: taskDescription.trim(),
      status: taskStatus,
      startDate: taskStartDate || undefined,
      dueDate: taskDueDate || undefined,
      department: taskDepartment.trim() || undefined,
      assignedTo: taskAssignedTo.trim() || undefined,
    };
    
    const fullyUpdatedTask: Task = {
        ...currentTask, 
        ...updatedTaskDetails 
    };

    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, tasks: updateTaskRecursive(p.tasks, fullyUpdatedTask) }
          : p
      )
    );
    closeModal();
  };
  
  const confirmDeleteTask = (projectId: string, taskId: string) => {
     openModal('confirmation', {
        confirmationTitle: "Delete Task",
        confirmationMessage: "Are you sure you want to delete this task and all its sub-tasks? This action cannot be undone.",
        onConfirmAction: () => handleDeleteTask(projectId, taskId)
    });
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, tasks: deleteTaskRecursive(p.tasks, taskId) } : p
      )
    );
    closeModal(); 
  };

  const handleUpdateTaskStatus = (projectId: string, taskId: string, newStatus: TaskStatus) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const updateStatusRecursive = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, status: newStatus };
              }
              if (task.subTasks && task.subTasks.length > 0) {
                return { ...task, subTasks: updateStatusRecursive(task.subTasks) };
              }
              return task;
            });
          };
          return { ...p, tasks: updateStatusRecursive(p.tasks) };
        }
        return p;
      })
    );
  };

  const handleFileUploadToTask = async (projectId: string, taskId: string, file: File) => {
    if (!isAdminLoggedIn) return; 
    
    if (file.size > 10 * 1024 * 1024) { 
        alert("File is too large. Maximum size is 10MB.");
        return;
    }

    try {
        const reader = new FileReader();
        reader.onloadend = () => {
            const fileData: FileData = {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: reader.result as string,
                uploadedAt: new Date().toISOString(),
            };

            setProjects(prevProjects =>
                prevProjects.map(p =>
                    p.id === projectId
                        ? { ...p, tasks: addFileToTaskRecursive(p.tasks, taskId, fileData) }
                        : p
                )
            );
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error processing file upload:", error);
        alert("An unexpected error occurred during file upload.");
    }
  };

  const handleDeleteFileFromTask = (projectId: string, taskId: string, fileId: string) => {
      if (!isAdminLoggedIn) return;
      openModal('confirmation', {
          confirmationTitle: "Delete File",
          confirmationMessage: "Are you sure you want to delete this file? This action cannot be undone.",
          onConfirmAction: () => {
              setProjects(prevProjects =>
                  prevProjects.map(p =>
                      p.id === projectId
                          ? { ...p, tasks: deleteFileFromTaskRecursive(p.tasks, taskId, fileId) }
                          : p
                  )
              );
              closeModal(); 
          }
      });
  };

  const handleLogin = async () => {
    const settings = await storage.loadSettings();
    if (settings.customAdminUser) {
      if (settings.customAdminUser.username === loginUsername && settings.customAdminUser.passwordHash === loginPassword) {
        setIsAdminLoggedIn(true);
        setLoginError('');
        closeModal();
        return;
      }
    }

    // Fallback to hardcoded admin users if custom admin doesn't exist or login fails
    const user = ADMIN_USERS.find(u => u.username === loginUsername);
    if (user && user.passwordHash === loginPassword) { 
      setIsAdminLoggedIn(true);
      setLoginError('');
      closeModal();
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
     openModal('confirmation', {
        confirmationTitle: "Confirm Logout",
        confirmationMessage: "Are you sure you want to log out?",
        onConfirmAction: () => {
            setIsAdminLoggedIn(false);
            closeModal(); 
        }
    });
  };

  const handleConfirmGeneric = () => {
    if (modalState.data?.onConfirmAction) {
      if (modalState.type === 'confirmation' && modalState.data.importedData) {
         modalState.data.onConfirmAction(modalState.data.importedData);
      } else {
        modalState.data.onConfirmAction();
      }
    }
  };

  const showErrorInModal = (message: string) => {
      openModal('confirmation', {
        confirmationTitle: "Error",
        confirmationMessage: message,
        confirmButtonText: "OK", 
        onConfirmAction: closeModal, 
      });
  };

  const performActualImport = async (dataToImport: ExportDataFormat) => {
    try {
      const validatedProjects = validateAndSanitizeProjects(dataToImport.projects);
      setProjects(validatedProjects); 
      // setIsAdminLoggedIn(dataToImport.adminLoggedIn); // Let login status be determined by existing sessions or new login
      
      // Explicitly save after setting state
      await storage.saveProjects(validatedProjects);
      // We don't necessarily import admin status, as the current admin initiated this.
      // If importing should also set admin, then uncomment the next lines:
      // await storage.saveSettings({ adminStatus: dataToImport.adminLoggedIn, customAdminUser: null });
      // setIsAdminLoggedIn(dataToImport.adminLoggedIn);

      console.log("Data imported successfully!");
      closeModal(); 
    } catch (error: any) {
      console.error("Error performing actual import:", error);
      showErrorInModal(`Import Failed: ${error.message || 'Unknown error during import processing.'}`);
    }
  };

  const handleFileSelectedForImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (importFileRef.current) importFileRef.current.value = ""; 

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') {
            showErrorInModal("Failed to read file content.");
            return;
          }
          const parsedData = JSON.parse(text) as ExportDataFormat;

          if (!parsedData || typeof parsedData.version !== 'string' || typeof parsedData.exportedAt !== 'string' || typeof parsedData.adminLoggedIn !== 'boolean' || !Array.isArray(parsedData.projects)) {
            throw new Error("Invalid ZenTrack backup file format. Core structure is missing or incorrect.");
          }
          if (parsedData.version !== '1.0') { 
            throw new Error(`Unsupported backup version: ${parsedData.version}. Expected 1.0.`);
          }
           if (!parsedData.projects.every(p => p && typeof p.id === 'string' && typeof p.name === 'string')) {
             throw new Error("Invalid project data within the backup file.");
          }
          
          openModal('confirmation', {
            confirmationTitle: 'Confirm Data Import',
            confirmationMessage: 'Importing data will replace all current projects. This action cannot be undone. Are you sure you want to proceed?',
            confirmButtonText: 'Import & Replace',
            onConfirmAction: () => performActualImport(parsedData), // Pass parsedData directly to onConfirmAction
            // importedData: parsedData // No longer needed if passed directly
          });

        } catch (error: any) {
          console.error("Error processing import file:", error);
          showErrorInModal(`Import Error: ${error.message || 'Could not parse or validate the backup file.'}`);
        }
      };
      reader.onerror = () => {
        showErrorInModal("Error reading the import file.");
      };
      reader.readAsText(file);
    }
  };

 const handleExportData = () => {
    const exportData: ExportDataFormat = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      adminLoggedIn: isAdminLoggedIn, 
      projects: projects 
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentrack_backup_${getFormattedDateTimeForFilename()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Data exported.");
  };

  const promptForNewAdminCredentials = () => {
    closeModal(); // Close the initial confirmation modal
    openModal('createAdminAfterReset');
  };
  
  const handleCompleteResetAndCreateAdmin = async () => {
    setNewAdminError('');
    if (!newAdminUsername.trim()) {
      setNewAdminError('New admin username cannot be empty.');
      return;
    }
    if (newAdminPassword.length < 6) { // Example: basic password length
      setNewAdminError('New admin password must be at least 6 characters long.');
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      setNewAdminError('Passwords do not match.');
      return;
    }

    try {
      // 1. Clear all project data
      setProjects([]);
      await storage.saveProjects([]);
      
      // 2. Delete any old custom admin user from DB
      await storage.deleteCustomAdminUser();

      // 3. Save new admin credentials to DB
      const newAdmin: AdminUser = { username: newAdminUsername.trim(), passwordHash: newAdminPassword }; // Storing password as "hash" for demo
      await storage.saveSettings({ adminStatus: true, customAdminUser: newAdmin });

      // 4. Set admin as logged in
      setIsAdminLoggedIn(true);

      closeModal(); // Close the createAdminAfterReset modal
      
      setTimeout(() => { // Small delay for modal to close visually
        alert("Application has been reset. New admin account created and you are now logged in.");
      }, 100);

    } catch (error) {
      console.error("Error during full reset and admin creation:", error);
      setNewAdminError("An error occurred during the reset process. Please try again.");
    }
  };

  const confirmFullReset = () => {
    openModal('confirmation', {
      confirmationTitle: "Confirm Full Application Reset",
      confirmationMessage: "DANGER ZONE!\nAre you sure you want to delete ALL projects and current admin settings? This action is IRREVERSIBLE.\n\nYou will be prompted to create a new admin account.",
      confirmButtonText: "Yes, Reset Data",
      onConfirmAction: promptForNewAdminCredentials, // This will lead to creating new admin
    });
  };

  if (!isInitialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-100">
        <div className="text-sky-600 text-xl">
          <PlayIcon className="w-12 h-12 animate-pulse inline-block mr-3" />
          Loading ZenTrack...
        </div>
      </div>
    );
  }

  const currentProjectForModal = projects.find(p => p.id === modalState.data?.projectId);
  const tasksForCurrentProject = currentProjectForModal ? sortTasksChronologically(currentProjectForModal.tasks) : [];


  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-sky-600 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <h1 className="text-2xl font-semibold">ZenTrack OSAT</h1>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0 flex-wrap">
            {isAdminLoggedIn && (
               <>
                <button 
                    onClick={handleExportData}
                    className="flex items-center bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-md text-sm transition-colors mb-2 sm:mb-0"
                    title="Export all data"
                >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-1.5" /> Export Data
                </button>
                <input type="file" accept=".json" ref={importFileRef} onChange={handleFileSelectedForImport} className="hidden" id="import-file-input"/>
                <label 
                    htmlFor="import-file-input"
                    className="flex items-center bg-sky-500 hover:bg-sky-700 text-white py-2 px-3 rounded-md text-sm transition-colors cursor-pointer mb-2 sm:mb-0"
                    title="Import data from backup"
                >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" /> Import Data
                </label>
                 <button 
                  onClick={handleAddMockOsatProject} 
                  className="flex items-center bg-teal-500 hover:bg-teal-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors mb-2 sm:mb-0"
                  title="Add Mock OSAT Project"
                >
                  <ChipIcon className="w-4 h-4 mr-1.5" /> Add Mock OSAT
                </button>
                <button onClick={() => openModal('addProject')} className="flex items-center bg-white text-sky-600 hover:bg-sky-100 py-2 px-3 rounded-md text-sm font-medium transition-colors mb-2 sm:mb-0">
                  <PlusIcon className="w-4 h-4 mr-1.5" /> Add Project
                </button>
                 <button 
                    onClick={confirmFullReset}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm transition-colors mb-2 sm:mb-0"
                    title="Reset Application Data - DANGER"
                >
                    <ArrowPathIcon className="w-4 h-4 mr-1.5" /> Reset App
                </button>
               </>
            )}
            <button 
                onClick={isAdminLoggedIn ? handleLogout : () => openModal('adminLogin')} 
                className="flex items-center bg-slate-100 text-sky-700 hover:bg-sky-200 py-2 px-3 rounded-md text-sm font-medium transition-colors mb-2 sm:mb-0"
                title={isAdminLoggedIn ? "Log Out" : "Admin Login"}
            >
              {isAdminLoggedIn ? <LogoutIcon className="w-4 h-4 mr-1.5" /> : <LoginIcon className="w-4 h-4 mr-1.5" />}
              {isAdminLoggedIn ? 'Logout' : 'Admin Login'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 flex-grow">
        {projects.length === 0 && !isAdminLoggedIn && ( 
             <div className="text-center py-10">
                <TasksIcon className="w-16 h-16 text-sky-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-700 mb-2">Welcome to ZenTrack OSAT</h2>
                <p className="text-slate-500 mb-6">
                Log in as admin to create and manage projects, or reset the application if you're setting it up for the first time.
                </p>
                <button 
                    onClick={() => openModal('adminLogin')} 
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-6 rounded-md transition-colors text-sm flex items-center mx-auto"
                >
                   <LoginIcon className="w-4 h-4 mr-2" /> Admin Login
                </button>
            </div>
        )}
        {projects.length === 0 && isAdminLoggedIn && (
          <div className="text-center py-10">
            <TasksIcon className="w-16 h-16 text-sky-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">No Projects Yet</h2>
            <p className="text-slate-500 mb-6">
              Click 'Add Project' or 'Add Mock OSAT' to get started.
            </p>
          </div>
        )}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => openModal('editProject', { project })}
                onDelete={() => confirmDeleteProject(project.id)}
                onManageTasks={() => openModal('manageTasks', { project, projectId: project.id })}
                isAdminMode={isAdminLoggedIn}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {modalState.type === 'addProject' && (
        <Modal isOpen={true} onClose={closeModal} title="Add New Project" size="lg">
          <form onSubmit={(e) => { e.preventDefault(); handleAddProject(); }} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
              <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="projectDescription" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={4} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors">Add Project</button>
            </div>
          </form>
        </Modal>
      )}

      {modalState.type === 'editProject' && modalState.data?.project && (
        <Modal isOpen={true} onClose={closeModal} title={`Edit Project: ${modalState.data.project.name}`} size="lg">
          <form onSubmit={(e) => { e.preventDefault(); handleEditProject(); }} className="space-y-4">
            <div>
              <label htmlFor="editProjectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
              <input type="text" id="editProjectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label htmlFor="editProjectDescription" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="editProjectDescription" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={4} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {modalState.type === 'manageTasks' && currentProjectForModal && (
        <Modal isOpen={true} onClose={closeModal} title={`Manage Tasks: ${currentProjectForModal.name}`} size="5xl">
          <div className="flex flex-col h-full">
             <div className="mb-4 p-1 bg-sky-100 rounded-md flex justify-between items-center">
                <div className="flex space-x-1">
                    {(['list', 'canvas', 'timeline'] as const).map(view => (
                        <button 
                            key={view}
                            onClick={() => setTaskViewMode(view)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                ${taskViewMode === view ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-sky-600 hover:bg-sky-50'}`}
                            title={`${view.charAt(0).toUpperCase() + view.slice(1)} View`}
                        >
                            {view === 'list' && <TasksIcon className="w-4 h-4 inline-block mr-1" />}
                            {view === 'canvas' && <CanvasViewIcon className="w-4 h-4 inline-block mr-1" />}
                            {view === 'timeline' && <TimelineIcon className="w-4 h-4 inline-block mr-1" />}
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                    ))}
                </div>
                {isAdminLoggedIn && (
                     <button onClick={() => openModal('addTask', { projectId: currentProjectForModal.id, parentTaskId: null, currentLevel: -1 })} className="flex items-center bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors">
                        <PlusIcon className="w-4 h-4 mr-1.5" /> Add Task
                    </button>
                )}
             </div>
            
            {taskViewMode === 'list' && (
                 <div className="flex-grow overflow-y-auto pr-2 -mr-2 custom-scrollbar-thin"> 
                    {tasksForCurrentProject.length === 0 ? (
                         <p className="text-slate-500 text-center py-6">
                            This project has no tasks. 
                            {isAdminLoggedIn && <span> Click "Add Task" to create one.</span>}
                        </p>
                    ) : (
                        tasksForCurrentProject.filter(task => !task.parentId).map(task => ( 
                        <TaskItem
                            key={task.id}
                            task={task}
                            projectId={currentProjectForModal.id}
                            onUpdateStatus={handleUpdateTaskStatus}
                            onEdit={(taskToEdit) => openModal('editTask', { projectId: currentProjectForModal.id, task: taskToEdit, taskId: taskToEdit.id })}
                            onDelete={confirmDeleteTask}
                            onAddSubTask={(projectId, parentTaskId, currentLevel) => openModal('addTask', { projectId, parentTaskId, currentLevel })}
                            onUploadFile={handleFileUploadToTask}
                            onDeleteFile={handleDeleteFileFromTask}
                            isAdminMode={isAdminLoggedIn}
                            level={0}
                        />
                        ))
                    )}
                </div>
            )}
            {taskViewMode === 'canvas' && (
                <div className="flex-grow overflow-auto border border-sky-200 rounded-md bg-sky-50">
                     <ProjectCanvasView 
                        project={currentProjectForModal} 
                        onEditTask={(taskToEdit, projectId) => openModal('editTask', { projectId, task: taskToEdit, taskId: taskToEdit.id})}
                        onAddSubTask={(projectId, parentTaskId, currentLevel) => openModal('addTask', { projectId, parentTaskId, currentLevel})}
                        isAdminMode={isAdminLoggedIn}
                     />
                </div>
            )}
             {taskViewMode === 'timeline' && (
                 <div className="flex-grow overflow-auto border border-sky-200 rounded-md bg-sky-50">
                    <ProjectTimelineView 
                        project={currentProjectForModal}
                        onEditTask={(taskToEdit, projectId) => openModal('editTask', { projectId, task: taskToEdit, taskId: taskToEdit.id})}
                        isAdminMode={isAdminLoggedIn}
                    />
                </div>
            )}
          </div>
        </Modal>
      )}

      {(modalState.type === 'addTask' || modalState.type === 'editTask') && (
        <Modal isOpen={true} onClose={closeModal} title={modalState.type === 'addTask' ? 'Add New Task' : `Edit Task: ${taskName}`} size="xl">
          <form onSubmit={(e) => { e.preventDefault(); modalState.type === 'addTask' ? handleAddTask() : handleEditTask(); }} className="space-y-4">
            <div>
              <label htmlFor="taskName" className="block text-sm font-medium text-slate-700 mb-1">Task Name <span className="text-red-500">*</span></label>
              <input type="text" id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} required className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="taskDescription" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="taskStatus" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select id="taskStatus" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as TaskStatus)} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white">
                  {Object.values(TaskStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
               <div>
                <label htmlFor="taskDepartment" className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input type="text" id="taskDepartment" value={taskDepartment} onChange={(e) => setTaskDepartment(e.target.value)} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
              </div>
              <div>
                <label htmlFor="taskAssignedTo" className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                <input type="text" id="taskAssignedTo" value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="taskStartDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input type="date" id="taskStartDate" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
              </div>
              <div>
                <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input type="date" id="taskDueDate" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"/>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors">
                {modalState.type === 'addTask' ? 'Add Task' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      
      {modalState.type === 'adminLogin' && (
        <Modal isOpen={true} onClose={closeModal} title="Admin Login" size="sm">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            {loginError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{loginError}</p>}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                id="username" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                required 
                className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password_login" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                id="password_login" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
                className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                autoComplete="current-password"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors">Login</button>
            </div>
          </form>
        </Modal>
      )}

      {modalState.type === 'createAdminAfterReset' && (
        <Modal isOpen={true} onClose={closeModal} title="Create New Admin Account" size="md">
          <form onSubmit={(e) => { e.preventDefault(); handleCompleteResetAndCreateAdmin(); }} className="space-y-4">
            <p className="text-sm text-slate-600">All application data will be cleared. Please create a new primary admin account.</p>
            {newAdminError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{newAdminError}</p>}
            <div>
              <label htmlFor="newAdminUsername" className="block text-sm font-medium text-slate-700 mb-1">New Admin Username <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="newAdminUsername" 
                value={newAdminUsername} 
                onChange={(e) => setNewAdminUsername(e.target.value)} 
                required 
                className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="newAdminPassword_create" className="block text-sm font-medium text-slate-700 mb-1">New Password (min. 6 chars) <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                id="newAdminPassword_create" 
                value={newAdminPassword} 
                onChange={(e) => setNewAdminPassword(e.target.value)} 
                required 
                className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
             <div>
              <label htmlFor="newAdminConfirmPassword_create" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                id="newAdminConfirmPassword_create" 
                value={newAdminConfirmPassword} 
                onChange={(e) => setNewAdminConfirmPassword(e.target.value)} 
                required 
                className="w-full p-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
              >
                Cancel Reset
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Create Admin & Complete Reset
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalState.type === 'confirmation' && modalState.data && (
          <ConfirmationModal
            isOpen={true}
            onClose={closeModal}
            onConfirm={handleConfirmGeneric}
            title={modalState.data.confirmationTitle || "Confirm Action"}
            message={modalState.data.confirmationMessage || "Are you sure?"}
            confirmButtonText={modalState.data.confirmButtonText}
          />
      )}

      <footer className="bg-sky-700 text-sky-200 text-center p-3 text-xs mt-auto">
        ZenTrack OSAT &copy; {new Date().getFullYear()}. Minimalist Project Management.
      </footer>
       <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: #f0f9ff; /* sky-50 */
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: #bae6fd; /* sky-200 */
          border-radius: 3px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #7dd3fc; /* sky-300 */
        }
      `}</style>
    </div>
  );
};

export default App;
