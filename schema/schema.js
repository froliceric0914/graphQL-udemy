const graphql = require('graphql');
const axios = require('axios');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = graphql;

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  //put the fields into a closure to avoid  the error of using UserType before initialization
  fields: () => ({
    id: { type: GraphQLString }, //id is a string?
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType), //tell graphQL that the companies could have multiple user linked to it
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then((res) => res.data);
      },
    },
  }),
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    //Nested Queries
    company: {
      type: CompanyType,
      resolve(parentValue, agrs) {
        console.log('parentValue, agrs: ', parentValue, agrs);
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then((res) => res.data);
      },
    },
  }),
});

//the query name that can be utilize by the graphiQL
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        //promise that handled by graphQL internally
        return axios
          .get(`http://localhost:3000/users/${args.id}`)
          .then((res) => res.data);
      },
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then((res) => res.data);
      },
    },
  },
});

//different ObejectType basically have different resolve funtion

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType, // sometimes it will return to another typed
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) }, // low-level validation
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, { firstName, age }) {
        return axios
          .post('http://localhost:3000/users', { firstName, age })
          .then((res) => res.data);
      },
    },
    editUser: {
      type: UserType, // sometimes it will return to another typed
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString }, // low-level validation
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, args) {
        return axios
          .patch(`http://localhost:3000/users/${args.id}`, args) //patch only update patially/fully of the field(s) input
          .then((res) => res.data);
      },
    },
    deleteUser: {
      type: UserType, // sometimes it will return to another typed
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }, // low-level validation
      },
      resolve(parentValue, args) {
        return axios
          .delete(`http://localhost:3000/users/${args.id}`)
          .then((res) => res.data);
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
});
