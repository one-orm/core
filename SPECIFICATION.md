# One ORM Specification

This is a loose and living specification that describes how One ORM _Core_ is expected to operate and perform. This document may be updated at any time.


## Model Definition

A model definition is a Javascript object representation of the state of a table or collection in the underlying datastore. An example model definition looks like:

```
{
	id: {
		type: Boolean,
		primaryKey: true
	},
	email: {
		type: String,
		match: /.+\@.+\..+/,
		unique: true,
		allowNull: false
	},
	name: {
		type: String,
		field: 'full_name',
		comment: 'The user\'s full name'
	},
	nickname: String,
	friends: {
		manyToMany: User
	},
	enemies: {
		references: {
			model: User,
			type: 'many-to-many',
			joinTableName: 'user_enemies'
		}
	},
	projects: {
		references: {
			model: Project,
			through: UserProject
		}
	}
}
```


### Validation

### Hooks

## Relationships

### One-To-One

### Many-To-One

### One-To-Many

### Many-To-Many 

#### Eccentric Variations

## Inheritance

### Strategies