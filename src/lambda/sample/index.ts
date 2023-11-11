// lambda index.ts

export async function handler(event: any) {
	    console.log(event);
    return {
	statusCode: 200,
	body: JSON.stringify({
	    message: 'hello world',
	}),
    };
}