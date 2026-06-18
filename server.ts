import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { supabaseAdmin } from './src/lib/supabase-admin.js'

async function startServer() {
  const app = express()
  const PORT = 3000

  app.use(express.json())

  // --- API Routes ---
  
  // Seed admin
  app.get('/api/seed', async (req, res) => {
    try {
      const email = 'admin@kabarak.ac.ke'
      const password = '12345678'
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError && authError.message !== 'User already registered') {
        return res.status(400).json({ error: authError.message })
      }

      // If user exists, we get it by email to update profile
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      const user = usersData?.users.find(u => u.email === email)
      
      if (user) {
        // Upsert profile
        await supabaseAdmin.from('profiles').upsert({
           id: user.id,
           email,
           name: 'Root Admin',
           role: 'admin',
           status: 'active'
        })
        return res.json({ success: true, message: 'Admin seeded successfully.' })
      }

      res.status(500).json({ error: 'Failed to seed admin' })
    } catch (e: any) {
      console.error(e)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })

  // Create user
  app.post('/api/admin/users', async (req, res) => {
    try {
      const { email, password, name, role, studentNumber, course, year, department } = req.body

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create user' })
      }

      const userId = authData.user.id

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({ id: userId, name, email, role, status: 'active' })

      if (profileError) {
        // Rollback
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return res.status(400).json({ error: profileError.message })
      }

      // Role specifics
      if (role === 'student') {
        await supabaseAdmin.from('students').insert({
          profile_id: userId,
          student_number: studentNumber,
          full_name: name,
          email,
          course,
          year: parseInt(year, 10),
        })
      } else if (role === 'lecturer') {
        await supabaseAdmin.from('lecturers').insert({
          profile_id: userId,
          full_name: name,
          email,
          department,
        })
      }

      res.status(201).json({ success: true, user: authData.user })

    } catch (e: any) {
      console.error(e)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })

  // Update user
  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, studentNumber, course, year, department, password } = req.body;

      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(id, { password });
      }

      await supabaseAdmin.from('profiles').update({ name, role }).eq('id', id);

      if (role === 'student') {
        const { data: existingStudent } = await supabaseAdmin.from('students').select('*').eq('profile_id', id).single();
        if (existingStudent) {
          await supabaseAdmin.from('students').update({
            full_name: name,
            student_number: studentNumber,
            course,
            year: parseInt(year, 10),
          }).eq('profile_id', id);
        } else {
             const userProfile = await supabaseAdmin.from('profiles').select('email').eq('id',id).single();
              await supabaseAdmin.from('students').insert({
              profile_id: id,
              student_number: studentNumber,
              full_name: name,
              email: userProfile.data?.email || '',
              course,
              year: parseInt(year, 10),
            })
        }
      } else if (role === 'lecturer') {
         const { data: existingLecturer } = await supabaseAdmin.from('lecturers').select('*').eq('profile_id', id).single();
         if (existingLecturer) {
          await supabaseAdmin.from('lecturers').update({
            full_name: name,
            department,
          }).eq('profile_id', id);
         } else {
             const userProfile = await supabaseAdmin.from('profiles').select('email').eq('id',id).single();
             await supabaseAdmin.from('lecturers').insert({
              profile_id: id,
              full_name: name,
              email: userProfile.data?.email || '',
              department,
            })
         }
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Bulk create users
  app.post('/api/admin/users/bulk', async (req, res) => {
    try {
      const { users } = req.body
      if (!Array.isArray(users)) return res.status(400).json({ error: 'Expected array of users' })

      let successCount = 0
      const errors = []

      for (const row of users) {
        const { email, password, name, role, studentNumber, course, year, department } = row
        
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'kabarak123',
            email_confirm: true,
          })

          if (authError || !authData.user) {
             errors.push({ email, error: authError?.message || 'Failed auth prep' })
             continue
          }

          const userId = authData.user.id

          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({ id: userId, name, email, role, status: 'active' })

          if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userId)
            errors.push({ email, error: profileError.message })
            continue
          }

          if (role === 'student') {
             await supabaseAdmin.from('students').insert({
              profile_id: userId, student_number: studentNumber, full_name: name, email, course, year: parseInt(year, 10) || 1,
            })
          } else if (role === 'lecturer') {
             await supabaseAdmin.from('lecturers').insert({
              profile_id: userId, full_name: name, email, department,
            })
          }
          successCount++
        } catch (err: any) {
           errors.push({ email, error: err.message })
        }
      }

      res.status(200).json({ successCount, errors })
    } catch (e: any) {
      console.error(e)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  })

  // Delete user
  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) throw error
      res.json({ success: true })
    } catch (e: any) {
      console.error(e)
      res.status(500).json({ error: e.message || 'Internal Server Error' })
    }
  })

  // Start Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on http://localhost:" + PORT)
  })
}

Object.defineProperty(BigInt.prototype, 'toJSON', {
  get() {
    "use strict";
    return () => String(this);
  }
});

startServer()
