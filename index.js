
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;


app.get('/', (req, res) => {
    res.send('Product server is running');
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.lu7tyzl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const database = client.db("scic-job-task")
        const taskList = database.collection("task-list")
        const user = database.collection("users")

        //insert tasks 

        app.post("/task-list", async (req, res) => {
            const request = req.body;
            const result = await taskList.insertOne(request);
            res.send(result)
        })

        //get latest tasks

        app.get("/all-tasks", async (req, res) => {
            const result = await taskList.find().sort({ _id: -1 }).toArray();
            res.send(result);
        });

        // update task status

        app.patch('/task-status/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedService = req.body;
            const user = {
                $set: {
                    status: updatedService.status,
                }
            }
            const result = await taskList.updateOne(filter, user, options);
            res.send(result)
        })

        // user task information

        app.get('/user-task/:userEmail', async (req, res) => {
            const userEmail = req.params.userEmail;

            try {

                if (!userEmail) {
                    return res.status(404).send({ error: 'User not found' });
                }

                const onGoingTasks = await taskList.countDocuments({
                    email: userEmail,
                    status: 'onGoing',
                });
                const allTasks = await taskList.countDocuments({
                    email: userEmail,
                });

                const completedTasks = await taskList.countDocuments({
                    email: userEmail,
                    status: 'done',
                });

                const canceledTask = await taskList.countDocuments({
                    email: userEmail,
                    status: 'canceled',
                });

                // Assuming 'payments' is the collection for donations

                res.send({
                    onGoingTasks: onGoingTasks,
                    completedTasks: completedTasks,
                    canceledTask: canceledTask,
                    allTasks: allTasks
                });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // get completed tasks

        app.get('/completed-tasks/:email', async (req, res) => {
            const email = req.params.email;

            try {
                // Assuming you have a 'tasks' collection
                const completedTasks = await taskList.find({ email: email, status: 'done' }).toArray();

                res.json(completedTasks);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        //user all task tasks

        app.get('/user-tasks/:email', async (req, res) => {
            const email = req.params.email;

            try {
                // Assuming you have a 'tasks' collection
                const completedTasks = await taskList.find({ email: email }).toArray();

                res.json(completedTasks);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // save user data

        app.post("/users", async (req, res) => {
            const users = req.body;
            console.log(user)
            const query = { email: users.email };
            const existUser = await user.findOne(query);
            if (existUser) {
                return res.send({ message: 'userExist', InsertedId: null });
            }
            const result = await user.insertOne(users)
            res.send(result)
        })

        // get user info

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await user.findOne(query)
            res.send(result)
        })

        // delete task

        app.delete("/delete-task/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await taskList.deleteOne(query);
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);
